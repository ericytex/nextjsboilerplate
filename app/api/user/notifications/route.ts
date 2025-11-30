/**
 * User Notification Preferences API
 * GET /api/user/notifications - Get user's notification preferences
 * PUT /api/user/notifications - Update user's notification preferences
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

// Get notification preferences
export async function GET(request: NextRequest) {
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    const { data: settings } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle()

    // Default notification preferences
    const defaultNotifications = {
      email: {
        enabled: true,
        marketing: true,
        productUpdates: true,
        securityAlerts: true,
        weeklyDigest: false,
        comments: true,
        mentions: true
      },
      push: {
        enabled: true,
        newVideos: true,
        comments: true,
        mentions: false,
        securityAlerts: true
      },
      inApp: {
        enabled: true,
        newVideos: true,
        comments: true,
        mentions: true,
        systemUpdates: true
      }
    }

    const notifications = settings?.settings?.notifications || defaultNotifications

    return NextResponse.json({
      success: true,
      notifications
    })
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notification preferences',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Update notification preferences
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
    const { notifications } = body

    if (!notifications) {
      return NextResponse.json({
        success: false,
        error: 'Notification preferences are required'
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
    const requestInfo = extractRequestInfo(request)

    // Check if user_settings exists
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id, settings')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingSettings) {
      // Update existing settings, merge with existing data
      const updatedSettings = {
        ...existingSettings.settings,
        notifications
      }

      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating notification preferences:', updateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update notification preferences',
          details: updateError.message
        }, { status: 500 })
      }
    } else {
      // Create new settings
      const { error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: userId,
          settings: { notifications }
        })

      if (insertError) {
        console.error('Error creating notification preferences:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Failed to save notification preferences',
          details: insertError.message
        }, { status: 500 })
      }
    }

    // Log activity
    await logActivity(supabaseUrl, serviceRoleKey, {
      action: 'user.notifications.updated',
      resource_type: 'user_settings',
      resource_id: userId,
      user_id: userId,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      metadata: {
        email_enabled: notifications.email?.enabled,
        push_enabled: notifications.push?.enabled,
        inApp_enabled: notifications.inApp?.enabled
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification preferences saved successfully'
    })
  } catch (error: any) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notification preferences',
        details: error.message
      },
      { status: 500 }
    )
  }
}




