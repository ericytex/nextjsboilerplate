/**
 * User Profile API
 * GET /api/user/profile - Get current user's profile
 * PUT /api/user/profile - Update current user's profile
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import { DEFAULT_AVATAR } from '@/lib/defaults'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Get user profile
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch profile',
        details: error.message
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get user settings for additional profile data
    const { data: settings } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle()

    const profileData = {
      id: user.id,
      email: user.email,
      fullName: user.full_name || '',
      avatar: user.avatar_url || DEFAULT_AVATAR,
      phone: settings?.settings?.phone || '',
      location: settings?.settings?.location || '',
      bio: settings?.settings?.bio || '',
      company: settings?.settings?.company || '',
      website: settings?.settings?.website || '',
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }

    return NextResponse.json({
      success: true,
      profile: profileData
    })
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profile',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const { getAuthenticatedUser } = await import('@/lib/api-auth')
    const authUser = await getAuthenticatedUser(request)

    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        message: 'Please sign in to access this resource'
      }, { status: 401 })
    }

    const userId = authUser.userId
    const body = await request.json()
    const { fullName, phone, location, bio, company, website, avatar } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const requestInfo = extractRequestInfo(request)

    // Update users table
    const userUpdateData: any = {
      updated_at: new Date().toISOString()
    }

    if (fullName !== undefined) {
      userUpdateData.full_name = fullName
    }

    if (avatar !== undefined) {
      userUpdateData.avatar_url = avatar
    }

    const { error: userError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('id', userId)

    if (userError) {
      console.error('Error updating user:', userError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update profile',
        details: userError.message
      }, { status: 500 })
    }

    // Update or create user_settings
    const settingsData = {
      phone: phone || null,
      location: location || null,
      bio: bio || null,
      company: company || null,
      website: website || null
    }

    // Remove null values
    Object.keys(settingsData).forEach(key => {
      if (settingsData[key as keyof typeof settingsData] === null) {
        delete settingsData[key as keyof typeof settingsData]
      }
    })

    // Check if user_settings exists
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingSettings) {
      // Update existing settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .update({
          settings: settingsData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (settingsError) {
        console.error('Error updating user settings:', settingsError)
        // Don't fail the request if settings update fails
      }
    } else {
      // Create new settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          settings: settingsData
        })

      if (settingsError) {
        console.error('Error creating user settings:', settingsError)
        // Don't fail the request if settings creation fails
      }
    }

    // Log activity
    await logActivity(supabaseUrl, serviceRoleKey, {
      action: 'user.profile.updated',
      resource_type: 'user',
      resource_id: userId,
      user_id: userId,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      metadata: {
        fields_updated: Object.keys({ fullName, phone, location, bio, company, website, avatar }).filter(
          key => body[key] !== undefined
        )
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile',
        details: error.message
      },
      { status: 500 }
    )
  }
}

