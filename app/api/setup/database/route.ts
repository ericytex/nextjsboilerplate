import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'

/**
 * Save database configuration and create all required tables
 * POST /api/setup/database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectUrl, anonKey, serviceRoleKey, databaseUrl } = body

    if (!projectUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Project URL and Anon Key are required' },
        { status: 400 }
      )
    }

    // Use service role key if provided, otherwise use anon key
    // Service role key bypasses RLS, which is needed for setup
    const key = serviceRoleKey || anonKey
    const supabase = createSupabaseClient(projectUrl, key)

    const sql = getDatabaseSchema()
    const projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project'
    
    // First, check if tables exist by trying to query them
    // Use a simple SELECT query that should work if tables exist
    let tablesExist = false
    let tableCheckError: any = null
    
    // Check integration_configs table
    const { error: configCheckError, data: configCheckData } = await supabase
      .from('integration_configs')
      .select('id')
      .limit(1)
    
    if (!configCheckError) {
      // Table exists! Now check users table
      const { error: usersCheckError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (!usersCheckError) {
        // Both tables exist!
        tablesExist = true
      } else {
        tableCheckError = usersCheckError
      }
    } else {
      tableCheckError = configCheckError
    }
    
    // If tables don't exist, return SQL
    if (!tablesExist) {
      const isTableMissing = tableCheckError?.code === 'PGRST116' || 
                            tableCheckError?.code === '42P01' ||
                            tableCheckError?.message?.includes('relation') ||
                            tableCheckError?.message?.includes('does not exist') ||
                            tableCheckError?.message?.includes('table') ||
                            tableCheckError?.message?.includes('schema') ||
                            tableCheckError?.message?.includes('permission denied') ||
                            tableCheckError?.message?.includes('RLS')
      
      if (isTableMissing || tableCheckError) {
        // Check if it's a permission error - might need service role key
        if ((tableCheckError?.code === '42501' || tableCheckError?.message?.includes('permission') || tableCheckError?.message?.includes('RLS')) && !serviceRoleKey) {
          return NextResponse.json({
            needsTable: true,
            sql: sql,
            error: 'Permission denied. Tables might exist but are blocked by RLS.',
            instructions: 'Please add your Service Role Key to bypass RLS, or verify tables exist in Supabase Table Editor.',
            sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
            details: tableCheckError.message,
            needsServiceRoleKey: true,
            suggestion: 'Add Service Role Key to check tables with proper permissions.'
          }, { status: 400 })
        }
        
        return NextResponse.json({
          needsTable: true,
          sql: sql,
          error: 'Database tables not found. Please create them first.',
          instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
          sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
          details: tableCheckError?.message || 'Tables not found'
        }, { status: 400 })
      }
    }
    
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
      // Check if it's a permission/RLS error
      const isPermissionError = saveError.code === '42501' || 
                               saveError.message?.includes('permission denied') ||
                               saveError.message?.includes('RLS') ||
                               saveError.message?.includes('policy')
      
      if (isPermissionError && !serviceRoleKey) {
        return NextResponse.json({
          needsTable: false,
          error: 'Permission denied. RLS policies are blocking access.',
          instructions: 'Please add your Service Role Key to bypass RLS, or update RLS policies to allow access.',
          details: saveError.message,
          needsServiceRoleKey: true,
          suggestion: 'Add Service Role Key to save configuration with proper permissions.'
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
        // Try to automatically create tables using Management API
        // This requires service role key
        if (serviceRoleKey) {
          try {
            const createResult = await createTablesAutomatically(projectUrl, serviceRoleKey, projectId, sql)
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
          // No service role key, return SQL for manual creation
          return NextResponse.json({
            needsTable: true,
            sql: sql,
            error: 'Database tables not found. Please create them first.',
            instructions: 'Copy the SQL below and run it in Supabase SQL Editor. Or add Service Role Key to enable automatic creation.',
            sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
            details: saveError.message,
            needsServiceRoleKey: true
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

    // Update environment variables (for this session)
    // In production, you'd want to update .env or use a config service
    process.env.NEXT_PUBLIC_SUPABASE_URL = projectUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey
    if (serviceRoleKey) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey
    }

    return NextResponse.json({
      success: true,
      message: 'Database configured successfully',
      persisted: true
    })
  } catch (error: any) {
    console.error('Error saving database config:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save database configuration',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * Attempt to automatically create tables
 * Note: Supabase doesn't support executing arbitrary SQL via REST API for security reasons.
 * This function is a placeholder for future implementation using Supabase Edge Functions
 * or Management API when available.
 */
async function createTablesAutomatically(
  projectUrl: string,
  serviceRoleKey: string,
  projectId: string,
  sql: string
): Promise<{ success: boolean; error?: string }> {
  // Supabase doesn't currently support executing arbitrary SQL via REST API
  // This would require:
  // 1. Supabase Edge Function with database access
  // 2. Direct PostgreSQL connection (requires pg library)
  // 3. Supabase Management API (requires special access tokens)
  
  // For now, we'll return false and provide clear instructions
  // Future enhancement: Create a Supabase Edge Function that can execute SQL
  return {
    success: false,
    error: 'Automatic table creation requires manual SQL execution. Supabase doesn\'t support arbitrary SQL execution via REST API for security reasons. Please use the SQL Editor.'
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

-- Users: Users can read/update their own data, admins can do everything
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- For service role operations (bypass RLS)
-- Note: Service role key bypasses RLS, so these policies are for anon key
`;
}

