import { NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import bcrypt from 'bcryptjs'

/**
 * Create admin user and complete setup
 * POST /api/setup/admin
 * 
 * NOTE: This endpoint REQUIRES Service Role Key to bypass RLS policies
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
    // MUST use Service Role Key for admin creation (bypasses RLS)
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If not in env, try to get from saved integration config
    if (!supabaseUrl || !serviceRoleKey) {
      // Try to get from integration_configs if it exists
      if (!supabaseUrl) {
        return NextResponse.json(
          { error: 'Supabase not configured. Please set up database first in the setup page.' },
          { status: 400 }
        )
      }
      
      // Try to get service role key from integration_configs
      if (supabaseUrl && !serviceRoleKey) {
        try {
          // Try to read from integration_configs using anon key
          const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          if (anonKey) {
            const tempSupabase = createSupabaseClient(supabaseUrl, anonKey)
            const { data: config } = await tempSupabase
              .from('integration_configs')
              .select('config')
              .eq('id', 'supabase')
              .single()
            
            if (config?.config?.customSettings?.serviceRoleKey) {
              serviceRoleKey = config.config.customSettings.serviceRoleKey
            }
          }
        } catch (e) {
          // Ignore errors, will check below
        }
      }
    }
    
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL not found. Please complete database setup first.' },
        { status: 400 }
      )
    }
    
    if (!serviceRoleKey) {
      return NextResponse.json(
        { 
          error: 'Service Role Key required for admin creation.',
          details: 'Admin user creation requires Service Role Key to bypass RLS policies. Please add your Service Role Key in the database setup step.',
          needsServiceRoleKey: true
        },
        { status: 400 }
      )
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

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
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: fullName,
        password_hash: passwordHash,
        role: 'admin',
        email_verified: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating admin user:', createError)
      return NextResponse.json(
        { 
          error: `Failed to create admin user: ${createError.message}`,
          details: createError.code === '42501' 
            ? 'RLS policy violation. Service Role Key is required to bypass RLS.'
            : createError.message,
          needsServiceRoleKey: createError.code === '42501'
        },
        { status: 500 }
      )
    }

    // Create default settings for the admin user
    const { error: settingsError } = await supabase
      .from('user_settings')
      .insert({
        user_id: newUser.id,
        settings: {}
      })

    if (settingsError) {
      console.error('Failed to create default settings for admin:', settingsError)
      // Don't block setup, but log the error
    }

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
