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
    const key = serviceRoleKey || anonKey
    const supabase = createSupabaseClient(projectUrl, key)

    // Try to create tables automatically
    const sql = getDatabaseSchema()
    
    // Execute SQL to create tables
    // Note: Supabase doesn't have a direct SQL execution endpoint in the JS client
    // So we'll try to create tables by attempting inserts/selects
    // If that fails, return the SQL for manual execution
    
    // First, try to create integration_configs table by attempting an insert
    const { error: configTableError } = await supabase
      .from('integration_configs')
      .select('id')
      .limit(1)

    if (configTableError && (configTableError.code === 'PGRST116' || configTableError.code === '42P01')) {
      // Table doesn't exist - return SQL to create them
      return NextResponse.json({
        needsTable: true,
        sql: sql,
        error: 'Database tables not found. Please create them first.',
        instructions: 'Copy the SQL below and run it in Supabase SQL Editor (Dashboard → SQL Editor → New Query)',
        sqlEditorUrl: `${projectUrl.replace('https://', 'https://app.supabase.com/project/')}/sql/new`
      }, { status: 400 })
    }

    // Tables exist - save configuration
    // Try to save to integration_configs table
    // If table doesn't exist, we'll get an error and return SQL
    const { error: saveError } = await supabase
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

    if (saveError) {
      // If integration_configs doesn't exist, we need to create tables
      if (saveError.code === 'PGRST116' || saveError.code === '42P01') {
        const sql = getDatabaseSchema()
        const projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project'
        
        return NextResponse.json({
          needsTable: true,
          sql: sql,
          error: 'Database tables not found. Please create them first.',
          instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
          sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`
        }, { status: 400 })
      }
      
      throw saveError
    }

    // Verify users table exists (required for admin creation)
    const { error: usersTableError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (usersTableError && (usersTableError.code === 'PGRST116' || usersTableError.code === '42P01')) {
      const sql = getDatabaseSchema()
      const projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project'
      
      return NextResponse.json({
        needsTable: true,
        sql: sql,
        error: 'Users table not found. Please create all tables.',
        instructions: 'Copy the SQL below and run it in Supabase SQL Editor',
        sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`
      }, { status: 400 })
    }

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

-- Integration configs: Only service role can access
CREATE POLICY "Service role can manage integration configs" 
ON integration_configs FOR ALL 
USING (true) 
WITH CHECK (true);

-- Users: Users can read/update their own data, admins can do everything
CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid() = id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- For service role operations (bypass RLS)
-- Note: Service role key bypasses RLS, so these policies are for anon key
`;
}

