import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import bcrypt from 'bcryptjs'

/**
 * User signin endpoint
 * POST /api/auth/signin
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      // Database not configured - redirect to setup
      console.error('Database configuration error - setup required')
      return NextResponse.json(
        { 
          error: 'Database not configured',
          needsSetup: true,
          message: 'Please complete database setup first.'
        },
        { status: 503 } // Service Unavailable
      )
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    // Check if database tables exist by trying to query users table
    const { error: tableCheckError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      // Table doesn't exist or database error
      if (tableCheckError.code === 'PGRST116' || tableCheckError.code === '42P01') {
        console.error('Database tables not found - setup required')
        return NextResponse.json(
          { 
            error: 'Database not set up',
            needsSetup: true,
            message: 'Please complete database setup first.'
          },
          { status: 503 } // Service Unavailable
        )
      }
      
      // Other database errors - log but don't expose
      console.error('Database error:', tableCheckError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, role, email_verified')
      .eq('email', email.toLowerCase())
      .limit(1)
      .maybeSingle()

    if (findError) {
      console.error('Error finding user:', findError)
      // Security: Don't expose database errors to users
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Security: Always return the same generic error message
    // to prevent email enumeration attacks
    const genericError = 'Invalid email or password'

    if (!user) {
      return NextResponse.json(
        { error: genericError },
        { status: 401 }
      )
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: genericError },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: genericError },
        { status: 401 }
      )
    }

    // Create session token (in production, use proper session management)
    // For now, we'll return user data and let the client handle session
    return NextResponse.json({
      success: true,
      message: 'Sign in successful',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        emailVerified: user.email_verified
      }
    })
  } catch (error: any) {
    console.error('Signin error:', error)
    // Security: Don't expose internal errors to users
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    )
  }
}

