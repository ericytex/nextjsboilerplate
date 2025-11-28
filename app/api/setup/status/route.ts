import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'

/**
 * Check if setup is already complete
 * GET /api/setup/status
 */
export async function GET() {
  try {
    // Check if we have Supabase credentials from environment
    // Support both new (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) and old (NEXT_PUBLIC_SUPABASE_ANON_KEY) key names
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If no credentials, setup is definitely not complete
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        setupComplete: false,
        message: 'Supabase not configured',
        needsSetup: true
      })
    }

    try {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

      // Check if admin user exists
      const { data: adminUsers, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('role', 'admin')
        .limit(1)

      if (error) {
        // Table doesn't exist or error - setup not complete
        if (error.code === 'PGRST116' || error.code === '42P01') {
          return NextResponse.json({
            setupComplete: false,
            message: 'Database tables not created yet',
            needsTables: true,
            error: error.message
          })
        }
        
        // Other errors - might be connection issue
        return NextResponse.json({
          setupComplete: false,
          message: 'Database connection issue',
          error: error.message
        })
      }

      // If admin user exists, setup is complete
      if (adminUsers && adminUsers.length > 0) {
        return NextResponse.json({
          setupComplete: true,
          message: 'Setup already completed',
          adminExists: true
        })
      }

      // Database configured but no admin
      return NextResponse.json({
        setupComplete: false,
        message: 'Admin user not found',
        needsAdmin: true
      })
    } catch (dbError: any) {
      // Database connection failed
      return NextResponse.json({
        setupComplete: false,
        message: 'Failed to connect to database',
        error: dbError.message
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      setupComplete: false,
      message: 'Setup check failed',
      error: error.message
    })
  }
}

