import { NextResponse } from 'next/server'

/**
 * Test Supabase connection
 * POST /api/supabase/test
 * Body: { url: string, key: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, key } = body

    if (!url || !key) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Missing Supabase URL or API key. Please provide both url and key in the request body.'
        },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Invalid Supabase URL format. Please check your Project URL.'
        },
        { status: 400 }
      )
    }

    // Create client with provided credentials
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test connection by checking if we can access Supabase
    // Try to query a table that should exist if setup is complete, or just verify connection works
    // First, try to check if integration_configs table exists (our app's table)
    const { error: configTableError } = await supabase
      .from('integration_configs')
      .select('id')
      .limit(1)
    
    // If integration_configs doesn't exist, try users table
    if (configTableError) {
      const { error: usersTableError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      // If both tables don't exist, that's okay - connection still works
      // Only fail if it's a connection/auth error, not a "table not found" error
      const isTableNotFound = configTableError.code === 'PGRST205' || 
                             configTableError.code === 'PGRST116' || 
                             configTableError.code === '42P01' ||
                             usersTableError?.code === 'PGRST205' ||
                             usersTableError?.code === 'PGRST116' ||
                             usersTableError?.code === '42P01'
      
      const isPermissionError = configTableError.code === '42501' ||
                                usersTableError?.code === '42501'
      
      // If it's a permission error, connection works but RLS is blocking (which is okay for testing)
      if (isPermissionError) {
        // Connection works, just RLS blocking - that's fine for a connection test
        return NextResponse.json({
          connected: true,
          message: 'Successfully connected to Supabase! Your credentials are valid. (Note: Tables may need to be created or RLS configured)',
          timestamp: new Date().toISOString()
        })
      }
      
      // If it's not a table not found error, it's a real connection issue
      if (!isTableNotFound && usersTableError) {
        return NextResponse.json(
          { 
            connected: false,
            error: `Connection test failed: ${usersTableError.message || configTableError.message}`,
            details: usersTableError.code || configTableError.code
          },
          { status: 500 }
        )
      }
      
      // Table not found is okay - connection works, tables just need to be created
      // This is a valid connection, just tables aren't set up yet
    }

    // If we get here, the connection works (even if tables don't exist yet)
    return NextResponse.json({
      connected: true,
      message: 'Successfully connected to Supabase! Your credentials are valid.',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    // Handle network errors, invalid credentials, etc.
    if (error.message?.includes('fetch')) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Network error: Could not reach Supabase. Please check your Project URL.'
        },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('Invalid API key')) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Invalid API key. Please check your Anon/Public Key.'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        connected: false,
        error: error.message || 'Failed to connect to Supabase. Please verify your credentials.'
      },
      { status: 500 }
    )
  }
}

/**
 * Test Supabase connection using environment variables
 * GET /api/supabase/test
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Supabase is not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your environment variables, or configure it in the dashboard.'
        },
        { status: 400 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { error } = await supabase.rpc('version')
    
    if (error && error.code !== '42883') { // 42883 = function not found, which is okay
      return NextResponse.json(
        { 
          connected: false,
          error: error.message
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

