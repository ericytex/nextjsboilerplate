import { createSupabaseClient } from './supabase-client'

export interface ActivityLogInput {
  action: string
  resource_type?: string
  resource_id?: string
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, any>
  user_id?: string
}

/**
 * Log an activity to Supabase activity_logs table
 * This function safely handles cases where Supabase might not be configured yet
 */
export async function logActivity(
  projectUrl: string | null,
  serviceRoleKey: string | null,
  activity: ActivityLogInput
): Promise<{ success: boolean; error?: string }> {
  // If Supabase is not configured, silently skip logging
  if (!projectUrl || !serviceRoleKey) {
    return { success: false, error: 'Supabase not configured' }
  }

  try {
    const supabase = createSupabaseClient(projectUrl, serviceRoleKey)

    const { error } = await supabase.from('activity_logs').insert({
      user_id: activity.user_id || null,
      action: activity.action,
      resource_type: activity.resource_type || null,
      resource_id: activity.resource_id || null,
      ip_address: activity.ip_address || null,
      user_agent: activity.user_agent || null,
      metadata: activity.metadata || {}
    })

    if (error) {
      // If table doesn't exist or RLS is blocking, that's okay - just log to console
      console.warn('⚠️ Failed to log activity to Supabase:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    // Silently fail - activity logging should never break the main flow
    console.warn('⚠️ Activity logging error:', error instanceof Error ? error.message : String(error))
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Extract IP address and user agent from a Request object
 */
export function extractRequestInfo(request: Request): {
  ip_address: string | null
  user_agent: string | null
} {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip_address = forwarded?.split(',')[0]?.trim() || realIp || null

  const user_agent = request.headers.get('user-agent') || null

  return { ip_address, user_agent }
}

