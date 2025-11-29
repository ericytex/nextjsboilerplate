import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import bcrypt from 'bcryptjs'

/**
 * User signup endpoint
 * POST /api/auth/signup
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, fullName } = body

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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

    // Check if user with this email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .limit(1)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== '42P01') {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      // Security: For signup, it's okay to reveal that email exists
      // since the user is trying to create an account, not enumerate emails
      return NextResponse.json(
        { 
          error: 'An account with this email already exists. Please sign in instead.',
          userExists: true
        },
        { status: 409 } // Conflict status code
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        password_hash: passwordHash,
        role: 'user',
        email_verified: false
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: `Failed to create account: ${createError.message}` },
        { status: 500 }
      )
    }

    // Create default settings for the user
    await supabase
      .from('user_settings')
      .insert({
        user_id: newUser.id,
        settings: {}
      })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name
      }
    })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account', details: error.message },
      { status: 500 }
    )
  }
}

