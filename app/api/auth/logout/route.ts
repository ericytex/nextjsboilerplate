/**
 * Logout API
 * POST /api/auth/logout
 * Handles user logout
 */

import { NextRequest, NextResponse } from 'next/server'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    // Log logout activity if user ID is provided
    if (userId) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && serviceRoleKey) {
          const requestInfo = extractRequestInfo(request)
          await logActivity(supabaseUrl, serviceRoleKey, {
            action: 'user.logout',
            resource_type: 'user',
            resource_id: userId,
            user_id: userId,
            ip_address: requestInfo.ip_address,
            user_agent: requestInfo.user_agent
          })
        }
      } catch (logError) {
        console.warn('⚠️ Failed to log logout activity (non-critical):', logError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error: any) {
    console.error('Logout error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to logout',
        details: error.message
      },
      { status: 500 }
    )
  }
}



