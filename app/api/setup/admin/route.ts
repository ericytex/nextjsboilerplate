import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'

/**
 * Create admin user and complete setup
 * POST /api/setup/admin
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

    // Get Supabase credentials from environment or saved config
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If not in env, try to get from saved integration config
    if (!supabaseUrl || !supabaseKey) {
      // Try to get from integration_configs if it exists
      // First, we need at least the URL to connect
      if (!supabaseUrl) {
        return NextResponse.json(
          { error: 'Supabase not configured. Please set up database first in the setup page.' },
          { status: 400 }
        )
      }
      
      // Try with anon key if we have URL
      if (supabaseUrl && !supabaseKey) {
        // We can't proceed without a key
        return NextResponse.json(
          { error: 'Supabase API key not found. Please complete database setup first.' },
          { status: 400 }
        )
      }
    }

    // Use service role key if available, otherwise anon key
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey
    
    if (!supabaseUrl || !key) {
      return NextResponse.json(
        { error: 'Supabase credentials incomplete. Please complete database setup first.' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseClient(supabaseUrl, key)

    // Check if admin already exists
    const { data: existingAdmins, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== '42P01') {
      return NextResponse.json(
        { error: `Database error: ${checkError.message}` },
        { status: 500 }
      )
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists. Setup is already complete.' },
        { status: 400 }
      )
    }

    // Check if user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .limit(1)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password using bcrypt
    const bcrypt = require('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        password_hash: passwordHash,
        role: 'admin',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating admin user:', createError)
      return NextResponse.json(
        { error: `Failed to create admin user: ${createError.message}` },
        { status: 500 }
      )
    }

    // Create user settings
    await supabase
      .from('user_settings')
      .insert({
        user_id: newUser.id,
        settings: {
          notifications: {
            email: true,
            push: true,
            inApp: true
          },
          theme: 'system',
          language: 'en'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    // Create activity log
    await supabase
      .from('activity_logs')
      .insert({
        user_id: newUser.id,
        action: 'admin_created',
        resource_type: 'user',
        resource_id: newUser.id,
        metadata: {
          setup: true,
          role: 'admin'
        },
        created_at: new Date().toISOString()
      })

    // Mark setup as complete by creating a setup record (optional)
    // Or we can just check for admin user existence

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role
      },
      setupComplete: true
    })
  } catch (error: any) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create admin user',
        details: error.message
      },
      { status: 500 }
    )
  }
}

