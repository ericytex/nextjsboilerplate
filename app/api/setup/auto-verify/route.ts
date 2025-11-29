import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Import the SQL schema function
function getDatabaseSchema(): string {
  // This should match the schema from database route
  // For now, we'll import it or duplicate it - let's get it from the same source
  return `-- Complete Database Schema
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

-- Enable Row Level Security
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create policies
DROP POLICY IF EXISTS "Service role can manage integration configs" ON integration_configs;
CREATE POLICY "Service role can manage integration configs" 
ON integration_configs FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

CREATE POLICY "Users can read own data" 
ON users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
ON users FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" 
ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage users" 
ON users FOR ALL 
USING (true) 
WITH CHECK (true);`;
}

/**
 * Auto-verify database connection and tables using env vars
 * This endpoint uses Service Role Key from env vars (if available) server-side
 * POST /api/setup/auto-verify
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectUrl, anonKey } = body

    if (!projectUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Project URL and Anon Key are required' },
        { status: 400 }
      )
    }

    // Use Service Role Key from env vars if available (server-side only, not exposed to client)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const databaseUrl = process.env.DATABASE_URL

    // Try with Service Role Key first (if available) to get accurate status
    const key = serviceRoleKey || anonKey
    const supabase = createClient(projectUrl, key)

    // Check if tables exist
    const { error: configCheckError, data: configCheckData } = await supabase
      .from('integration_configs')
      .select('id')
      .limit(1)

    if (!configCheckError) {
      // Tables exist and are accessible!
      return NextResponse.json({
        success: true,
        tablesExist: true,
        accessible: true,
        usedServiceRoleKey: !!serviceRoleKey,
        message: serviceRoleKey 
          ? 'Tables exist and are accessible with Service Role Key.'
          : 'Tables exist and are accessible with Anon Key.'
      })
    }

    // Check error type
    const isTableMissingError = configCheckError.code === 'PGRST205' || 
                                configCheckError.code === 'PGRST116' ||
                                configCheckError.code === '42P01' ||
                                configCheckError.message?.includes('Could not find the table') ||
                                configCheckError.message?.includes('relation') ||
                                configCheckError.message?.includes('does not exist')

    const isPermissionError = configCheckError.code === '42501' || 
                             configCheckError.message?.includes('permission denied') ||
                             configCheckError.message?.includes('RLS') ||
                             configCheckError.message?.includes('policy')

    const sql = getDatabaseSchema()
    const projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'your-project'

    if (isTableMissingError && serviceRoleKey) {
      // Tables truly don't exist (verified with Service Role Key)
      return NextResponse.json({
        success: false,
        tablesExist: false,
        accessible: false,
        usedServiceRoleKey: true,
        needsTable: true,
        message: 'Tables may not exist. Run the SQL schema in Supabase SQL Editor.',
        error: configCheckError.message,
        sql: sql,
        sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
        instructions: 'Copy the SQL below and run it in Supabase SQL Editor to create the required tables.'
      })
    } else if (isTableMissingError && !serviceRoleKey) {
      // Can't determine if tables exist or RLS is blocking
      return NextResponse.json({
        success: false,
        tablesExist: null, // Unknown
        accessible: false,
        usedServiceRoleKey: false,
        needsServiceRoleKey: true,
        needsTable: true, // Assume tables may not exist
        message: 'Tables may not exist. Run the SQL schema in Supabase SQL Editor.',
        error: configCheckError.message,
        sql: sql,
        sqlEditorUrl: `https://app.supabase.com/project/${projectId}/sql/new`,
        hint: 'PGRST205 can mean tables don\'t exist OR RLS is blocking. Service Role Key is needed to verify.',
        instructions: 'Add Service Role Key to verify, or run the SQL below to create tables if they don\'t exist.'
      })
    } else if (isPermissionError) {
      // Permission issue - tables likely exist but RLS is blocking
      return NextResponse.json({
        success: false,
        tablesExist: true, // Likely exist but blocked
        accessible: false,
        usedServiceRoleKey: !!serviceRoleKey,
        permissionIssue: true,
        message: serviceRoleKey 
          ? 'Permission error even with Service Role Key. Check RLS policies.'
          : 'Tables likely exist but RLS is blocking access. Add Service Role Key to bypass RLS.',
        error: configCheckError.message
      })
    }

    // Unknown error
    return NextResponse.json({
      success: false,
      tablesExist: null,
      accessible: false,
      usedServiceRoleKey: !!serviceRoleKey,
      message: 'Unknown error while checking tables.',
      error: configCheckError.message
    })

  } catch (error: any) {
    console.error('Auto-verify error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to auto-verify database',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

