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
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        setupComplete: false,
        message: 'Supabase not configured'
      })
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

    // Check if setup_complete table exists and has a record
    // Or check if admin user exists
    const { data: adminUsers, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('role', 'admin')
      .limit(1)

    if (error) {
      // Table doesn't exist or error - setup not complete
      return NextResponse.json({
        setupComplete: false,
        message: 'Database tables not created yet',
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

    return NextResponse.json({
      setupComplete: false,
      message: 'Admin user not found',
      needsAdmin: true
    })
  } catch (error: any) {
    return NextResponse.json({
      setupComplete: false,
      message: 'Setup check failed',
      error: error.message
    })
  }
}

