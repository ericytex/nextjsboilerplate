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
    
    // Test connection by making a simple query
    // We'll try to query a system table that should always exist
    // If that fails, we'll try a simple RPC call or just verify the connection works
    const { data, error } = await supabase
      .rpc('version') // This is a built-in PostgreSQL function that should work
    
    // If RPC doesn't work, try a simple select from a common table
    if (error) {
      // Try alternative: query from a table that might exist
      const { error: tableError } = await supabase
        .from('_prisma_migrations')
        .select('*')
        .limit(1)
      
      // If both fail, check if it's just a table not found error (which is okay)
      if (tableError && tableError.code !== 'PGRST116' && tableError.code !== '42P01') {
        // PGRST116 and 42P01 = table not found, which is acceptable
        // Other errors indicate connection issues
        return NextResponse.json(
          { 
            connected: false,
            error: `Connection test failed: ${tableError.message || error.message}`,
            details: tableError.code || error.code
          },
          { status: 500 }
        )
      }
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

