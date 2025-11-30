/**
 * Get Current User's Subscription
 * GET /api/user/subscription
 * Returns the current user's active subscription information
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'

// Mark route as dynamic
export const dynamic = 'force-dynamic'

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

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

    // Get user's active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, plan, status, billing_cycle, current_period_start, current_period_end, cancel_at_period_end, created_at')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch subscription',
        details: subscriptionError.message
      }, { status: 500 })
    }

    // Map database plan names to display names
    const planDisplayNames: Record<string, string> = {
      'starter': 'Basic',
      'pro': 'Pro',
      'business': 'Business',
      'enterprise': 'Enterprise'
    }

    // Format response
    const response = {
      success: true,
      subscription: subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        planDisplayName: planDisplayNames[subscription.plan] || subscription.plan,
        status: subscription.status,
        billingCycle: subscription.billing_cycle,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        isTrial: subscription.status === 'trialing',
        createdAt: subscription.created_at
      } : null
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching user subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription',
        details: error.message
      },
      { status: 500 }
    )
  }
}

