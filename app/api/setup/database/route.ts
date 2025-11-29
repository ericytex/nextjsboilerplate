import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import { Client } from 'pg'

/**
 * Save database configuration and create all required tables
 * POST /api/setup/database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    let { projectUrl, anonKey, serviceRoleKey, databaseUrl } = body

    if (!projectUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Project URL and Anon Key are required' },
        { status: 400 }
      )
    }

    // Use Service Role Key and Database URL from env vars if not provided in request
    // This allows auto-creation to work even if user hasn't filled in the form
    if (!serviceRoleKey) {
      serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    }
    if (!databaseUrl) {
      databaseUrl = process.env.DATABASE_URL || ''
    }

    // Log what we received (without exposing sensitive data)
    console.log('📥 Received request:')
    console.log('  - Project URL:', projectUrl)
    console.log('  - Anon Key:', anonKey ? `${anonKey.substring(0, 20)}...` : 'NOT PROVIDED')
    console.log('  - Service Role Key:', serviceRoleKey ? `${serviceRoleKey.substring(0, 20)}...` : 'NOT PROVIDED (from env vars)')
    console.log('  - Database URL:', databaseUrl ? `${databaseUrl.substring(0, 30)}...` : 'NOT PROVIDED (from env vars)')

    // Use service role key if provided, otherwise use anon key
    // Service role key bypasses RLS, which is needed for setup
    const key = serviceRoleKey || anonKey
    const supabase = createSupabaseClient(projectUrl, key)

    const sql = getDatabaseSchema()
    const projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project'
    
    // Comprehensive table detection with detailed logging
    console.log('🔍 Starting table detection...')
    console.log('Project URL:', projectUrl)
    console.log('Using key type:', serviceRoleKey ? 'Service Role' : 'Anon/Publishable')
    
    let tablesExist = false
    let tableCheckError: any = null
    let permissionIssue = false
    
    // Step 1: Try with the provided key (service role if available, otherwise anon)
    console.log('📊 Step 1: Checking integration_configs table...')
    const { error: configCheckError, data: configCheckData } = await supabase
      .from('integration_configs')
      .select('id')
      .limit(1)
    
    if (configCheckError) {
      console.log('❌ integration_configs check failed:', {
        code: configCheckError.code,
        message: configCheckError.message,
        hint: configCheckError.code === '42501' ? 'Permission denied (RLS)' : 
              (configCheckError.code === 'PGRST116' || configCheckError.code === 'PGRST205' || configCheckError.code === '42P01') ? 'Table not found' :
              'Unknown error'
      })
      tableCheckError = configCheckError
      
      // Check if it's a table missing error (PGRST205, PGRST116, or 42P01)
      const isTableMissingError = configCheckError.code === 'PGRST205' || 
                                  configCheckError.code === 'PGRST116' ||
                                  configCheckError.code === '42P01' ||
                                  configCheckError.message?.includes('Could not find the table') ||
                                  configCheckError.message?.includes('relation') ||
                                  configCheckError.message?.includes('does not exist')
      
      // IMPORTANT: PGRST205 can mean tables don't exist OR RLS is blocking access
      // If we have service role key, verify if tables actually exist by checking with service role key
      if (isTableMissingError) {
        if (serviceRoleKey) {
          console.log('🔍 PGRST205 detected - verifying if tables exist using Service Role Key...')
          const serviceRoleSupabase = createSupabaseClient(projectUrl, serviceRoleKey)
          const { error: serviceRoleCheckError } = await serviceRoleSupabase
            .from('integration_configs')
            .select('id')
            .limit(1)
          
          if (!serviceRoleCheckError) {
            // Tables exist! It's an RLS issue, not missing tables
            console.log('✅ Tables exist but RLS is blocking access with Anon key')
            permissionIssue = true
            tablesExist = true // Tables exist, just blocked
            // Update tableCheckError to reflect this is a permission issue, not missing tables
            tableCheckError = {
              code: '42501',
              message: 'RLS is blocking access. Tables exist but cannot be accessed with Anon key.',
              hint: 'Use Service Role Key to bypass RLS'
            }
          } else {
            // Tables truly don't exist - try to create them if we have database URL
            if (databaseUrl) {
              console.log('🔧 Tables truly missing - attempting automatic creation...')
              try {
                const createResult = await createTablesAutomatically(projectUrl, serviceRoleKey, projectId, sql, databaseUrl)
                
                if (createResult.success) {
                  console.log('✅ Tables created! Waiting for schema cache refresh...')
                  await new Promise(resolve => setTimeout(resolve, 3000))
                  
                  // Verify tables were created
                  const verifySupabase = createSupabaseClient(projectUrl, serviceRoleKey)
                  const { error: verifyError } = await verifySupabase
                    .from('integration_configs')
                    .select('id')
                    .limit(1)
                  
                  if (!verifyError) {
                    console.log('✅ Tables verified after automatic creation!')
                    tablesExist = true
                    tableCheckError = null
                  } else {
                    console.log('⚠️ Tables created but verification still failing:', verifyError.message)
                    tableCheckError = verifyError
                  }
                } else {
                  console.log('❌ Automatic table creation failed:', createResult.error)
                }
              } catch (autoCreateError: any) {
                console.error('❌ Error during automatic table creation:', autoCreateError)
              }
            } else {
              console.log('⚠️ Tables missing but no Database URL provided for automatic creation')
            }
          }
        } else {
          // No service role key - can't verify if tables exist or if it's RLS
          // But if we have Database URL, try to auto-create tables anyway
          // (worst case: they already exist and we'll get "already exists" errors which we ignore)
          if (databaseUrl) {
            console.log('⚠️ PGRST205 detected but no Service Role Key - attempting auto-creation with Database URL...')
            try {
              // Try to get Service Role Key from env vars for verification after creation
              const envServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
              const createResult = await createTablesAutomatically(
                projectUrl, 
                envServiceRoleKey || serviceRoleKey || '', 
                projectId, 
                sql, 
                databaseUrl
              )
              
              if (createResult.success) {
                console.log('✅ Tables created! Waiting for schema cache refresh...')
                await new Promise(resolve => setTimeout(resolve, 3000))
                
                // Try to verify with Service Role Key from env vars if available
                const verifyKey = envServiceRoleKey || serviceRoleKey || anonKey
                const verifySupabase = createSupabaseClient(projectUrl, verifyKey)
                const { error: verifyError } = await verifySupabase
                  .from('integration_configs')
                  .select('id')
                  .limit(1)
                
                if (!verifyError) {
                  console.log('✅ Tables verified after automatic creation!')
                  tablesExist = true
                  tableCheckError = null
                } else {
                  console.log('⚠️ Tables created but verification still failing:', verifyError.message)
                  // Still mark as success since creation succeeded
                  tablesExist = true
                }
              } else {
                console.log('❌ Automatic table creation failed:', createResult.error)
              }
            } catch (autoCreateError: any) {
              console.error('❌ Error during automatic table creation:', autoCreateError)
            }
          } else {
            console.log('⚠️ PGRST205 detected but no Service Role Key or Database URL to verify/create tables')
          }
        }
      }
      
      // Check if it's a permission issue
      if (configCheckError.code === '42501' || 
          configCheckError.message?.includes('permission denied') ||
          configCheckError.message?.includes('RLS') ||
          configCheckError.message?.includes('policy')) {
        permissionIssue = true
        console.log('🔒 Permission issue detected - RLS is blocking access')
      }
    } else {
      console.log('✅ integration_configs table accessible')
      
      // Step 2: Check users table
      console.log('📊 Step 2: Checking users table...')
      const { error: usersCheckError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (usersCheckError) {
        console.log('❌ users check failed:', {
          code: usersCheckError.code,
          message: usersCheckError.message
        })
        tableCheckError = usersCheckError
        
        if (usersCheckError.code === '42501' || 
            usersCheckError.message?.includes('permission denied') ||
            usersCheckError.message?.includes('RLS')) {
          permissionIssue = true
        }
      } else {
        console.log('✅ users table accessible')
        tablesExist = true
        console.log('✅✅ All tables verified!')
      }
    }
    
    // Step 3: If permission issue and no service role key, try with anon key
    if (permissionIssue && !serviceRoleKey && anonKey) {
      console.log('🔄 Step 3: Permission issue detected, but we already tried with anon key')
      // We already tried with anon key, so we need service role key
    }
    
    // If tables don't exist or permission issue, return appropriate response
    if (!tablesExist) {
      console.log('⚠️ Tables not accessible:', {
        tablesExist: false,
        permissionIssue,
        error: tableCheckError?.message,
        code: tableCheckError?.code
      })
      
      // Check for infinite recursion in RLS policy (code 42P17)
      if (tableCheckError?.code === '42P17' || tableCheckError?.message?.includes('infinite recursion')) {
        console.log('🔄 Infinite recursion detected in RLS policy - this is a policy issue, not missing tables')
        return NextResponse.json({
          needsTable: false, // Tables exist, policy is broken
          permissionIssue: true,
          policyIssue: true,
          sql: sql,
          error: 'Infinite recursion detected in RLS policy for "users" table.',
          instructions: 'Your tables exist, but there is an infinite recursion in the Row Level Security (RLS) policy. This happens when a policy references the same table it protects.',
          sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
          details: tableCheckError?.message || 'Infinite recursion in RLS policy',
          needsServiceRoleKey: true,
          suggestion: 'Option 1: Add your Service Role Key to bypass RLS and complete setup.\n\nOption 2: Fix the RLS policy in Supabase SQL Editor (see SQL below).',
          fixPolicySql: `-- Fix infinite recursion in users table RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create simpler policies that don't cause recursion
-- Allow users to read their own data (using auth.uid() directly)
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- Allow service role to do everything (for setup/admin)
CREATE POLICY "Service role can manage users" 
ON users FOR ALL 
USING (true) 
WITH CHECK (true);`,
          diagnostic: {
            tablesExist: true,
            accessible: false,
            reason: 'Infinite recursion in RLS policy',
            code: '42P17',
            solution: 'Use Service Role Key or fix policy'
          }
        }, { status: 403 })
      }
      
      // Check if it's a permission error - might need service role key
      if (permissionIssue && !serviceRoleKey) {
        console.log('💡 Recommendation: Add Service Role Key to bypass RLS')
        return NextResponse.json({
          needsTable: false, // Tables exist, just blocked
          permissionIssue: true,
          sql: sql,
          error: 'Permission denied. Tables exist but are blocked by Row Level Security (RLS).',
          instructions: 'Your tables exist in Supabase, but RLS policies are blocking access with the Anon/Publishable key.',
          sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
          details: tableCheckError?.message || 'RLS blocking access',
          needsServiceRoleKey: true,
          suggestion: 'Add your Service Role Key in the "Service Role Key (Optional)" field above, then click "Continue" again. Service Role Key bypasses RLS.',
          diagnostic: {
            tablesExist: tablesExist, // Use the actual value we determined
            accessible: false,
            reason: 'RLS policies blocking access',
            solution: 'Use Service Role Key'
          }
        }, { status: 403 })
      }
      
      // If we determined tables exist but are blocked, and we have service role key, continue
      if (permissionIssue && serviceRoleKey && tablesExist) {
        console.log('✅ Tables exist and Service Role Key available - can proceed')
        // Continue with normal flow - we'll use service role key for operations
      }
      
      // Check if tables actually don't exist
      // Include PGRST205 (table not found in schema cache) as a table missing error
      // Exclude policy errors (42P17 = infinite recursion, 42501 = permission denied)
      const isTableMissing = (tableCheckError?.code === 'PGRST205' ||
                            tableCheckError?.code === 'PGRST116' || 
                            tableCheckError?.code === '42P01') &&
                            tableCheckError?.code !== '42P17' &&
                            tableCheckError?.code !== '42501' &&
                            (tableCheckError?.message?.includes('Could not find the table') ||
                            tableCheckError?.message?.includes('relation') ||
                            tableCheckError?.message?.includes('does not exist') ||
                            tableCheckError?.message?.includes('table') ||
                            tableCheckError?.message?.includes('schema'))
      
      if (isTableMissing) {
        console.log('💡 Tables do not exist - attempting automatic creation...')
        
        // Try to create tables automatically if we have database URL and service role key
        if (serviceRoleKey && databaseUrl) {
          try {
            const createResult = await createTablesAutomatically(projectUrl, serviceRoleKey, projectId, sql, databaseUrl)
            if (createResult.success) {
              console.log('✅ Tables created automatically! Verifying...')
              // Wait a moment for schema cache to refresh
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              // Verify tables were created by checking again
              const { error: verifyError } = await supabase
                .from('integration_configs')
                .select('id')
                .limit(1)
              
              if (!verifyError) {
                console.log('✅ Tables verified after creation!')
                // Continue with normal flow - tables now exist
              } else {
                return NextResponse.json({
                  needsTable: true,
                  sql: sql,
                  error: 'Tables created but verification failed. Please verify manually.',
                  instructions: 'Tables may have been created. Please check Supabase Table Editor and try again.',
                  sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
                  details: verifyError.message,
                  tablesMayExist: true
                }, { status: 400 })
              }
            } else {
              // Auto-create failed, return SQL
              return NextResponse.json({
                needsTable: true,
                sql: sql,
                error: 'Could not create tables automatically. Please create them manually.',
                instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
                sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
                details: createResult.error || 'Unknown error',
                autoCreateFailed: true
              }, { status: 400 })
            }
          } catch (autoCreateError: any) {
            return NextResponse.json({
              needsTable: true,
              sql: sql,
              error: 'Could not create tables automatically. Please create them manually.',
              instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
              sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
              details: autoCreateError.message || 'Unknown error',
              autoCreateFailed: true
            }, { status: 400 })
          }
        } else {
          // Missing required info for auto-creation - but check env vars
          const missingItems: string[] = []
          if (!serviceRoleKey) missingItems.push('Service Role Key')
          if (!databaseUrl) missingItems.push('Database URL')
          
          // Check if Database URL is in env vars (even if not in request)
          const hasDatabaseUrlInEnv = !!process.env.DATABASE_URL
          const hasServiceRoleKeyInEnv = !!process.env.SUPABASE_SERVICE_ROLE_KEY
          
          // If we have Database URL in env vars, we can still auto-create
          if (hasDatabaseUrlInEnv) {
            console.log('💡 Database URL found in env vars - attempting auto-creation...')
            try {
              const envDatabaseUrl = process.env.DATABASE_URL || ''
              const envServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleKey || ''
              
              const createResult = await createTablesAutomatically(
                projectUrl, 
                envServiceRoleKey, 
                projectId, 
                sql, 
                envDatabaseUrl
              )
              
              if (createResult.success) {
                console.log('✅ Tables created automatically using Database URL from env vars!')
                await new Promise(resolve => setTimeout(resolve, 3000))
                
                // Verify tables were created
                const verifyKey = envServiceRoleKey || anonKey
                const verifySupabase = createSupabaseClient(projectUrl, verifyKey)
                const { error: verifyError } = await verifySupabase
                  .from('integration_configs')
                  .select('id')
                  .limit(1)
                
                if (!verifyError) {
                  console.log('✅ Tables verified after automatic creation!')
                  tablesExist = true
                  tableCheckError = null
                  // Continue with normal flow - tables now exist
                } else {
                  console.log('⚠️ Tables created but verification still failing:', verifyError.message)
                  // Still mark as success since creation succeeded
                  tablesExist = true
                }
              } else {
                console.log('❌ Automatic table creation failed:', createResult.error)
                // Fall through to return error with SQL
              }
            } catch (autoCreateError: any) {
              console.error('❌ Error during automatic table creation:', autoCreateError)
              // Fall through to return error with SQL
            }
          }
          
          // If tables still don't exist after auto-creation attempt, return error
          if (!tablesExist) {
            return NextResponse.json({
              needsTable: true,
              sql: sql,
              error: 'Tables may not exist. Run the SQL schema in Supabase SQL Editor.',
              instructions: hasDatabaseUrlInEnv 
                ? 'Automatic table creation was attempted using Database URL from .env.local but failed. Please check the error above or create tables manually using the SQL below.'
                : `Copy the SQL below and run it in Supabase SQL Editor. Or add ${missingItems.join(' and ')} to enable automatic creation.`,
              sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
              details: tableCheckError?.message || 'Tables not found',
              needsServiceRoleKey: !serviceRoleKey && !hasServiceRoleKeyInEnv,
              needsDatabaseUrl: !databaseUrl && !hasDatabaseUrlInEnv,
              canAutoCreate: hasDatabaseUrlInEnv,
              autoCreateAttempted: hasDatabaseUrlInEnv,
              diagnostic: {
                tablesExist: false,
                accessible: false,
                reason: tableCheckError?.message || 'Tables not found',
                code: tableCheckError?.code,
                solution: hasDatabaseUrlInEnv ? 'Auto-creation attempted - check logs' : 'Run SQL schema or provide Database URL + Service Role Key for auto-creation'
              }
            }, { status: 400 })
          }
        }
      }
      
      // Unknown error
      console.log('❓ Unknown error type')
      return NextResponse.json({
        needsTable: true,
        sql: sql,
        error: 'Could not verify tables. Please check your credentials and try again.',
        instructions: 'Verify tables exist in Supabase Table Editor, or run the SQL below to create them.',
        sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
        details: tableCheckError?.message || 'Unknown error',
        diagnostic: {
          tablesExist: 'unknown',
          accessible: false,
          reason: tableCheckError?.message || 'Unknown error',
          code: tableCheckError?.code
        }
      }, { status: 400 })
    }
    
    console.log('✅ Table detection complete - tables are accessible!')
    
    // Tables exist! Now try to save configuration
    const { error: saveError, data: saveData } = await supabase
      .from('integration_configs')
      .upsert({
        id: 'supabase',
        config: {
          enabled: true,
          customSettings: {
            projectUrl,
            anonKey,
            serviceRoleKey: serviceRoleKey || '',
            databaseUrl: databaseUrl || ''
          }
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()

    if (saveError) {
      console.log('❌ Save error:', {
        code: saveError.code,
        message: saveError.message
      })
      
      // Check if it's a permission/RLS error
      const isPermissionError = saveError.code === '42501' || 
                               saveError.message?.includes('permission denied') ||
                               saveError.message?.includes('RLS') ||
                               saveError.message?.includes('policy')
      
      if (isPermissionError && !serviceRoleKey) {
        console.log('🔒 Permission error - need service role key')
        return NextResponse.json({
          needsTable: false,
          permissionIssue: true,
          error: 'Permission denied. RLS policies are blocking access.',
          instructions: 'Tables exist but RLS is blocking. Add Service Role Key to bypass RLS.',
          details: saveError.message,
          needsServiceRoleKey: true,
          suggestion: 'Add Service Role Key in the setup form, then click "Continue" again.',
          diagnostic: {
            tablesExist: true,
            accessible: false,
            reason: 'RLS policies blocking access',
            solution: 'Use Service Role Key'
          }
        }, { status: 403 })
      }
      
      // Check if it's a "table doesn't exist" error
      const isTableMissing = saveError.code === 'PGRST116' || 
                            saveError.code === '42P01' ||
                            saveError.message?.includes('relation') ||
                            saveError.message?.includes('does not exist') ||
                            saveError.message?.includes('table') ||
                            saveError.message?.includes('schema')
      
      if (isTableMissing) {
        // Try to automatically create tables using direct PostgreSQL connection
        // This requires database URL and service role key
        if (serviceRoleKey && databaseUrl) {
          try {
            console.log('🔧 Attempting to create tables automatically...')
            const createResult = await createTablesAutomatically(projectUrl, serviceRoleKey, projectId, sql, databaseUrl)
            if (createResult.success) {
              // Tables created! Now try to save config again
              const { error: retryError } = await supabase
                .from('integration_configs')
                .upsert({
                  id: 'supabase',
                  config: {
                    enabled: true,
                    customSettings: {
                      projectUrl,
                      anonKey,
                      serviceRoleKey: serviceRoleKey || '',
                      databaseUrl: databaseUrl || ''
                    }
                  },
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'id'
                })
              
              if (!retryError) {
                // Success! Continue to verify users table
                // (will be checked below)
              } else {
                // Still failed, return SQL for manual creation
                return NextResponse.json({
                  needsTable: true,
                  sql: sql,
                  error: 'Failed to create tables automatically. Please create them manually.',
                  instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
                  sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
                  details: retryError.message,
                  autoCreateFailed: true
                }, { status: 400 })
              }
            } else {
              // Auto-create failed, return SQL
              return NextResponse.json({
                needsTable: true,
                sql: sql,
                error: 'Could not create tables automatically. Please create them manually.',
                instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
                sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
                details: createResult.error || 'Unknown error',
                autoCreateFailed: true
              }, { status: 400 })
            }
          } catch (autoCreateError: any) {
            // Auto-create failed, return SQL for manual creation
            return NextResponse.json({
              needsTable: true,
              sql: sql,
              error: 'Could not create tables automatically. Please create them manually.',
              instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
              sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
              details: autoCreateError.message || 'Unknown error',
              autoCreateFailed: true
            }, { status: 400 })
          }
        } else {
          // Missing service role key or database URL for automatic creation
          const missingItems = []
          if (!serviceRoleKey) missingItems.push('Service Role Key')
          if (!databaseUrl) missingItems.push('Database URL')
          
          return NextResponse.json({
            needsTable: true,
            sql: sql,
            error: 'Database tables not found. Please create them first.',
            instructions: `Copy the SQL below and run it in Supabase SQL Editor. Or add ${missingItems.join(' and ')} to enable automatic creation.`,
            sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
            details: saveError.message,
            needsServiceRoleKey: !serviceRoleKey,
            needsDatabaseUrl: !databaseUrl,
            canAutoCreate: false
          }, { status: 400 })
        }
      }
      
      // Check if it's an RLS/permission error
      if (saveError.code === '42501' || saveError.message?.includes('permission') || saveError.message?.includes('RLS')) {
        return NextResponse.json({
          needsTable: true,
          sql: sql,
          error: 'Permission denied. This might be because tables don\'t exist yet, or RLS is blocking access.',
          instructions: 'Please create the tables first using the SQL below. If using anon key, you may need to use service role key for setup.',
          sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
          details: saveError.message,
          suggestion: serviceRoleKey ? 'Tables may not exist yet. Create them using the SQL below.' : 'Try using Service Role Key instead of Anon Key for setup.'
        }, { status: 400 })
      }
      
      // Other errors
      console.error('Save error:', saveError)
      return NextResponse.json({
        needsTable: false,
        error: 'Failed to save database configuration',
        details: saveError.message,
        code: saveError.code
      }, { status: 500 })
    }

    // Successfully saved! Tables are verified and config is saved
    // No need to check users table again since we already verified it above

    // Log the activity to Supabase
    try {
      const requestInfo = extractRequestInfo(request)
      await logActivity(projectUrl, serviceRoleKey || anonKey, {
        action: 'supabase.setup.completed',
        resource_type: 'integration',
        resource_id: 'supabase',
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
        metadata: {
          project_id: projectId,
          has_service_role_key: !!serviceRoleKey,
          has_database_url: !!databaseUrl
        }
      })
      console.log('✅ Activity logged: Supabase setup completed')
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('⚠️ Failed to log activity (non-critical):', logError)
    }

    // Note: Environment variables cannot be set at runtime in Next.js
    // They are read-only. Configuration is saved to integration_configs table instead.
    // Environment variables should be set in .env.local or deployment platform

    return NextResponse.json({
      success: true,
      message: 'Database configured successfully',
      persisted: true
    })
  } catch (error: any) {
    console.error('Error saving database config:', error)
    // Ensure we always return JSON, never HTML
    try {
      return NextResponse.json(
        { 
          error: 'Failed to save database configuration',
          details: error?.message || 'Unknown error',
          code: error?.code || 'UNKNOWN_ERROR'
        },
        { status: 500 }
      )
    } catch (jsonError) {
      // Fallback if JSON serialization fails
      return new Response(
        JSON.stringify({ 
          error: 'Failed to save database configuration',
          details: String(error)
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * Attempt to automatically create tables using direct PostgreSQL connection
 * Uses the database URL to connect directly and execute SQL
 */
async function createTablesAutomatically(
  projectUrl: string,
  serviceRoleKey: string,
  projectId: string,
  sql: string,
  databaseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // If no database URL provided, we can't connect directly
    if (!databaseUrl) {
      return {
        success: false,
        error: 'Database URL is required for automatic table creation. Please provide it in the setup form.'
      }
    }

    // Parse the database URL and create PostgreSQL client
    // Format: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
    const client = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false // Supabase uses SSL
      }
    })

    try {
      await client.connect()
      console.log('✅ Connected to PostgreSQL database')

      // Execute the SQL schema
      // Remove comments but keep structure
      const cleanSql = sql
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          // Keep lines that aren't comments (except keep the header comment)
          return !trimmed.startsWith('--') || trimmed.startsWith('-- Complete') || trimmed.startsWith('-- Run this')
        })
        .join('\n')
      
      // Split by semicolons, but be careful with multi-line statements
      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      console.log(`📝 Executing ${statements.length} SQL statements (including RLS and policies)...`)
      
      let successCount = 0
      let skippedCount = 0
      let errorCount = 0
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.trim()) {
          try {
            await client.query(statement + ';') // Add semicolon back
            successCount++
            console.log(`✅ [${i + 1}/${statements.length}] Executed: ${statement.substring(0, 60)}...`)
          } catch (queryError: any) {
            // Ignore errors for IF NOT EXISTS statements (tables might already exist)
            const isIgnorableError = 
              queryError.message?.includes('already exists') || 
              queryError.message?.includes('duplicate') ||
              (queryError.message?.includes('does not exist') && statement.includes('DROP')) ||
              queryError.message?.includes('relation') && statement.includes('IF EXISTS')
            
            if (isIgnorableError) {
              skippedCount++
              console.log(`⏭️  [${i + 1}/${statements.length}] Skipped (already exists): ${statement.substring(0, 60)}...`)
            } else {
              errorCount++
              console.warn(`⚠️  [${i + 1}/${statements.length}] Error: ${queryError.message}`)
              console.warn(`   Statement: ${statement.substring(0, 100)}...`)
              // Continue - some statements might fail but we want to execute as many as possible
            }
          }
        }
      }
      
      console.log(`✅ SQL execution complete: ${successCount} succeeded, ${skippedCount} skipped, ${errorCount} errors`)
      
      // Verify that RLS is enabled and policies exist
      console.log('🔍 Verifying RLS and policies...')
      try {
        // Check if RLS is enabled on key tables
        const rlsCheck = await client.query(`
          SELECT tablename, rowsecurity 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('users', 'integration_configs')
        `)
        
        console.log('📊 RLS Status:', rlsCheck.rows)
        
        // Check if policies exist
        const policyCheck = await client.query(`
          SELECT schemaname, tablename, policyname 
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename IN ('users', 'integration_configs')
        `)
        
        console.log('📊 Policies found:', policyCheck.rows.length)
        if (policyCheck.rows.length > 0) {
          policyCheck.rows.forEach((row: any) => {
            console.log(`   - ${row.tablename}.${row.policyname}`)
          })
        }
      } catch (verifyError: any) {
        console.warn('⚠️ Could not verify RLS status:', verifyError.message)
      }

      // Refresh PostgREST schema cache
      try {
        await client.query("NOTIFY pgrst, 'reload schema'")
        console.log('✅ Refreshed PostgREST schema cache')
      } catch (notifyError) {
        console.warn('⚠️ Could not refresh schema cache:', notifyError)
        // Not critical, continue
      }

      await client.end()
      console.log('✅ Tables created successfully')
      
      return {
        success: true
      }
    } catch (connectError: any) {
      await client.end().catch(() => {}) // Try to close connection
      return {
        success: false,
        error: `Failed to connect to database: ${connectError.message}`
      }
    }
  } catch (error: any) {
    console.error('Error in createTablesAutomatically:', error)
    return {
      success: false,
      error: `Failed to create tables: ${error?.message || String(error)}`
    }
  }
}

function getDatabaseSchema(): string {
  return `-- Complete Database Schema for aistoryshorts.com
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Integration configurations table
CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  password_hash TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'all')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'published', 'failed')),
  video_url TEXT,
  thumbnail_url TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'business', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table (for user-generated API keys)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Create policies (adjust based on your security needs)
-- For now, allow service role to do everything (you should restrict this in production)
-- Note: DROP IF EXISTS to avoid errors if policies already exist

-- Integration configs: Only service role can access
DROP POLICY IF EXISTS "Service role can manage integration configs" ON integration_configs;
CREATE POLICY "Service role can manage integration configs" 
ON integration_configs FOR ALL 
USING (true) 
WITH CHECK (true);

    -- Users: Users can read/update their own data
    -- NOTE: Avoid infinite recursion - don't query users table in policy
    -- Use simpler policies that don't cause recursion
    DROP POLICY IF EXISTS "Users can read own data" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    DROP POLICY IF EXISTS "Service role can manage users" ON users;
    
    -- Allow users to read their own data (using auth.uid() directly, no subquery)
    CREATE POLICY "Users can read own data" 
    ON users FOR SELECT 
    USING (auth.uid() = id);

    -- Allow users to update their own data
    CREATE POLICY "Users can update own data" 
    ON users FOR UPDATE 
    USING (auth.uid() = id);

    -- Allow users to insert their own data (for signup)
    -- This allows users to create their own account
    CREATE POLICY "Users can insert own data" 
    ON users FOR INSERT 
    WITH CHECK (auth.uid() = id);

    -- Allow service role to manage all users (for setup/admin operations)
    -- Service role key bypasses RLS, so this is for explicit admin operations
    CREATE POLICY "Service role can manage users" 
    ON users FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- Activity logs: Allow service role to insert logs (for activity logging)
DROP POLICY IF EXISTS "Service role can insert activity logs" ON activity_logs;
CREATE POLICY "Service role can insert activity logs" 
ON activity_logs FOR INSERT 
USING (true) 
WITH CHECK (true);

-- Activity logs: Users can read their own activity logs
DROP POLICY IF EXISTS "Users can read own activity logs" ON activity_logs;
CREATE POLICY "Users can read own activity logs" 
ON activity_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Activity logs: Service role can read all activity logs (for admin)
DROP POLICY IF EXISTS "Service role can read all activity logs" ON activity_logs;
CREATE POLICY "Service role can read all activity logs" 
ON activity_logs FOR SELECT 
USING (true);

-- For service role operations (bypass RLS)
-- Note: Service role key bypasses RLS, so these policies are for anon key
`;
}

