import { NextResponse } from 'next/server'
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Test Supabase connection
 * GET /api/supabase/test
 */
export async function GET(request: Request) {
  try {
    // Check if credentials are provided via headers (for testing from dashboard)
    const headers = request.headers
    const testUrl = headers.get('X-Supabase-URL')
    const testKey = headers.get('X-Supabase-Key')

    let supabaseUrl: string | undefined
    let supabaseKey: string | undefined

    if (testUrl && testKey) {
      // Use test credentials from dashboard
      supabaseUrl = testUrl
      supabaseKey = testKey
    } else if (isSupabaseConfigured()) {
      // Use environment variables
      supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your environment variables, or configure it in the dashboard.'
        },
        { status: 400 }
      )
    }

    // Create client with provided or env credentials
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test connection by querying a simple table or using health check
    // This is a simple test - adjust based on your schema
    const { data, error } = await supabase
      .from('_prisma_migrations') // This table exists in most Supabase projects
      .select('*')
      .limit(1)

    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is okay for a test
      return NextResponse.json(
        { 
          connected: false,
          error: error.message,
          details: error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      connected: true,
      message: 'Successfully connected to Supabase',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        connected: false,
        error: error.message || 'Failed to connect to Supabase'
      },
      { status: 500 }
    )
  }
}

