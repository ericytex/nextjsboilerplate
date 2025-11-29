import { NextResponse } from 'next/server'

/**
 * Get Supabase environment variables (for pre-filling setup form)
 * GET /api/setup/env-vars
 * 
 * Note: Only returns variables that are safe to expose to client
 * (NEXT_PUBLIC_* variables are already public)
 */
export async function GET() {
  try {
    // Only return public variables that are safe to expose
    // These are already public (NEXT_PUBLIC_ prefix)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Service Role Key should NOT be exposed to client
    // We'll check if it exists but not return it
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    // Check if Database URL exists (but don't return it for security)
    const hasDatabaseUrl = !!process.env.DATABASE_URL

    return NextResponse.json({
      hasEnvVars: !!(supabaseUrl && (anonKey || hasServiceRoleKey)),
      supabaseUrl: supabaseUrl || '',
      anonKey: anonKey || '',
      hasServiceRoleKey: hasServiceRoleKey,
      hasDatabaseUrl: hasDatabaseUrl,
      // Don't return service role key or database URL for security
      // User can add them manually if needed, or they'll be used server-side
    })
  } catch (error: any) {
    console.error('Error reading env vars:', error)
    return NextResponse.json({
      hasEnvVars: false,
      supabaseUrl: '',
      anonKey: '',
      hasServiceRoleKey: false
    })
  }
}

