/**
 * User Password Change API
 * PUT /api/user/password
 * Updates user's password with validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Current password and new password are required'
      }, { status: 400 })
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'New password must be at least 8 characters long'
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

    // Get current user to verify current password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Verify current password
    if (!user.password_hash) {
      return NextResponse.json({
        success: false,
        error: 'Password change not available for this account'
      }, { status: 400 })
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await logActivity(supabaseUrl, serviceRoleKey, {
        action: 'user.password.change.failed',
        resource_type: 'user',
        resource_id: userId,
        user_id: userId,
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
        metadata: {
          reason: 'invalid_current_password'
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Current password is incorrect'
      }, { status: 401 })
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash)
    if (isSamePassword) {
      return NextResponse.json({
        success: false,
        error: 'New password must be different from current password'
      }, { status: 400 })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update password',
        details: updateError.message
      }, { status: 500 })
    }

    // Log successful password change
    await logActivity(supabaseUrl, serviceRoleKey, {
      action: 'user.password.changed',
      resource_type: 'user',
      resource_id: userId,
      user_id: userId,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      metadata: {
        email: user.email
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })
  } catch (error: any) {
    console.error('Error changing password:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to change password',
        details: error.message
      },
      { status: 500 }
    )
  }
}




