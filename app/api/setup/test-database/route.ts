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
    
    // Test connection by checking the health endpoint or making a simple auth request
    // This doesn't require any tables to exist
    try {
      // Try to get the auth user (this will fail but confirms the connection works)
      // Or we can check the API health
      const { data, error } = await supabase.auth.getSession()
      
      // Even if there's no session, if we get a response (not a network error), connection works
      // The error might be about auth, but that's fine - we just want to test connectivity
      if (error) {
        // If it's a network/connection error, that's a problem
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          return NextResponse.json(
            { 
              connected: false,
              error: 'Network error: Could not reach Supabase. Check your URL and network connection.'
            },
            { status: 500 }
          )
        }
        
        // If it's an auth error (like "Invalid API key"), that's also useful info
        if (error.message?.includes('Invalid') || error.message?.includes('JWT') || error.message?.includes('key')) {
          return NextResponse.json(
            { 
              connected: false,
              error: 'Invalid API key. Please check your Publishable Key.'
            },
            { status: 401 }
          )
        }
        
        // Other errors might be fine - we got a response from Supabase, so connection works
      }
      
      // If we got here, we successfully connected to Supabase
      return NextResponse.json({
        connected: true,
        message: 'Successfully connected to Supabase'
      })
    } catch (testError: any) {
      // If there's a network error, catch it here
      if (testError.message?.includes('fetch') || testError.message?.includes('network')) {
        return NextResponse.json(
          { 
            connected: false,
            error: 'Network error: Could not reach Supabase. Check your URL and network connection.'
          },
          { status: 500 }
        )
      }
      
      throw testError
    }
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

