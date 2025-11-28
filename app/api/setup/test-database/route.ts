import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Test Supabase database connection
 * POST /api/setup/test-database
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, key } = body

    if (!url || !key) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Missing Supabase URL or API key'
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
          error: 'Invalid Supabase URL format'
        },
        { status: 400 }
      )
    }

    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test connection
    const { error } = await supabase.rpc('version')
    
    // If RPC doesn't work, try a simple query
    if (error) {
      const { error: queryError } = await supabase
        .from('_prisma_migrations')
        .select('*')
        .limit(1)
      
      if (queryError && queryError.code !== 'PGRST116' && queryError.code !== '42P01') {
        return NextResponse.json(
          { 
            connected: false,
            error: `Connection test failed: ${queryError.message}`
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      connected: true,
      message: 'Successfully connected to Supabase'
    })
  } catch (error: any) {
    if (error.message?.includes('fetch')) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Network error: Could not reach Supabase'
        },
        { status: 500 }
      )
    }
    
    if (error.message?.includes('Invalid API key')) {
      return NextResponse.json(
        { 
          connected: false,
          error: 'Invalid API key'
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        connected: false,
        error: error.message || 'Failed to connect to Supabase'
      },
      { status: 500 }
    )
  }
}

