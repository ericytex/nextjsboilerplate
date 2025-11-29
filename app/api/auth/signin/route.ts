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

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Database not configured. Please contact support.' },
        { status: 500 }
      )
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key not configured. Please contact support.' },
        { status: 500 }
      )
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, role, email_verified')
      .eq('email', email.toLowerCase())
      .limit(1)
      .maybeSingle()

    if (findError) {
      console.error('Error finding user:', findError)
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          userNotFound: true,
          message: 'No account found with this email. Please sign up first.'
        },
        { status: 401 }
      )
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Account setup incomplete. Please contact support.' },
        { status: 500 }
      )
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
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
    return NextResponse.json(
      { error: 'Failed to sign in', details: error.message },
      { status: 500 }
    )
  }
}

