/**
 * Cancel User Subscription
 * POST /api/user/subscription/cancel
 * Cancels the current user's subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import { getCreemClientFromEnv } from '@/lib/creem-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, cancelImmediately = false } = body

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
    const requestInfo = extractRequestInfo(request)

    // Get user's active subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, plan, status, cancel_at_period_end')
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

    if (!subscription) {
      return NextResponse.json({
        success: false,
        error: 'No active subscription found'
      }, { status: 404 })
    }

    // If already set to cancel at period end, return success
    if (subscription.cancel_at_period_end && !cancelImmediately) {
      return NextResponse.json({
        success: true,
        message: 'Subscription is already set to cancel at period end',
        alreadyCancelled: true
      })
    }

    // Update subscription in database
    const updateData: any = {
      cancel_at_period_end: !cancelImmediately,
      updated_at: new Date().toISOString()
    }

    if (cancelImmediately) {
      updateData.status = 'canceled'
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to cancel subscription',
        details: updateError.message
      }, { status: 500 })
    }

    // Optionally cancel in Creem.io if subscription ID is available
    // Note: We'd need to store Creem subscription ID in our database for this
    // For now, we'll just update our local database
    try {
      const creemApiKey = process.env.CREEM_API_KEY
      if (creemApiKey) {
        // If you have Creem subscription ID stored, you could cancel it here
        // const creemClient = getCreemClientFromEnv()
        // await creemClient.cancelSubscription({ subscriptionId: creemSubscriptionId, cancelImmediately })
      }
    } catch (creemError) {
      console.warn('Failed to cancel in Creem.io (non-critical):', creemError)
      // Don't fail the request if Creem cancellation fails
    }

    // Log activity
    await logActivity(supabaseUrl, serviceRoleKey, {
      action: 'user.subscription.cancelled',
      resource_type: 'subscription',
      resource_id: subscription.id,
      user_id: userId,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      metadata: {
        plan: subscription.plan,
        cancel_immediately: cancelImmediately,
        cancel_at_period_end: !cancelImmediately
      }
    })

    return NextResponse.json({
      success: true,
      message: cancelImmediately 
        ? 'Subscription cancelled immediately' 
        : 'Subscription will be cancelled at the end of the billing period',
      subscription: {
        id: subscription.id,
        cancelAtPeriodEnd: !cancelImmediately,
        status: cancelImmediately ? 'canceled' : subscription.status
      }
    })
  } catch (error: any) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel subscription',
        details: error.message
      },
      { status: 500 }
    )
  }
}




