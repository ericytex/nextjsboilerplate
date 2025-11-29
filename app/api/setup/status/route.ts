import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'

/**
 * Check if setup is already complete
 * GET /api/setup/status
 */
export async function GET() {
  try {
    // Check if we have Supabase credentials from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If no URL, setup is definitely not complete
    if (!supabaseUrl) {
      return NextResponse.json({
        setupComplete: false,
        message: 'Supabase not configured',
        needsSetup: true
      })
    }

    // Try to get credentials from saved integration_configs if not in env
    let finalServiceRoleKey = serviceRoleKey
    let finalAnonKey = anonKey

    if (!finalServiceRoleKey && !finalAnonKey) {
      // No keys in env - try to get from integration_configs
      // But we need at least anon key to read integration_configs...
      // This is a chicken-and-egg problem, so we'll just return needsSetup
      return NextResponse.json({
        setupComplete: false,
        message: 'Supabase credentials not found',
        needsSetup: true
      })
    }

    // Try with service role key first (bypasses RLS)
    // If not available, try with anon key
    const keyToUse = finalServiceRoleKey || finalAnonKey
    if (!keyToUse) {
      return NextResponse.json({
        setupComplete: false,
        message: 'Supabase API key not found',
        needsSetup: true
      })
    }

    try {
      const supabase = createSupabaseClient(supabaseUrl, keyToUse)

      // Check if admin user exists
      // Use service role key if available to bypass RLS
      const { data: adminUsers, error } = await supabase
        .from('users')
        .select('id, role, email')
        .eq('role', 'admin')
        .limit(1)

      if (error) {
        // Table doesn't exist - setup not complete
        if (error.code === 'PGRST116' || error.code === '42P01') {
          return NextResponse.json({
            setupComplete: false,
            message: 'Database tables not created yet',
            needsTables: true,
            error: error.message
          })
        }
        
        // RLS error - might mean tables exist but we need service role key
        if (error.code === '42501' || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          // If we're using anon key and getting RLS error, try to check if we can at least connect
          // If service role key is not available, we can't verify admin exists
          if (!finalServiceRoleKey) {
            return NextResponse.json({
              setupComplete: false,
              message: 'RLS blocking access. Service Role Key needed to verify setup status.',
              needsServiceRoleKey: true,
              error: error.message
            })
          }
        }
        
        // Other errors - might be connection issue
        console.error('Status check error:', error)
        return NextResponse.json({
          setupComplete: false,
          message: 'Database connection issue',
          error: error.message,
          code: error.code
        })
      }

      // If admin user exists, setup is complete
      if (adminUsers && adminUsers.length > 0) {
        console.log('✅ Setup complete - admin user found:', adminUsers[0].email)
        return NextResponse.json({
          setupComplete: true,
          message: 'Setup already completed',
          adminExists: true,
          adminEmail: adminUsers[0].email
        })
      }

      // Database configured but no admin
      console.log('⚠️ No admin user found')
      return NextResponse.json({
        setupComplete: false,
        message: 'Admin user not found',
        needsAdmin: true
      })
    } catch (dbError: any) {
      // Database connection failed
      console.error('Database connection error:', dbError)
      return NextResponse.json({
        setupComplete: false,
        message: 'Failed to connect to database',
        error: dbError.message
      })
    }
  } catch (error: any) {
    console.error('Setup status check error:', error)
    return NextResponse.json({
      setupComplete: false,
      message: 'Setup check failed',
      error: error.message
    })
  }
}

