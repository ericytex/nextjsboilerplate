/**
 * Free Plan Signup Tracking Endpoint
 * POST /api/track-free-signup
 * Tracks free plan signups and creates subscription records
 * Used when users sign up for the free plan (business pays for users)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, plan = 'free' } = body

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      // If Supabase not configured, just log and return success
      console.log('Free plan signup tracked (Supabase not configured):', { userId, email, plan })
      return NextResponse.json({
        success: true,
        message: 'Free plan signup tracked (database not configured)',
        tracked: false
      })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const requestInfo = extractRequestInfo(request)

    // Find user by ID or email
    let user = null
    if (userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', userId)
        .maybeSingle()
      
      if (userData) {
        user = userData
      }
    }

    if (!user && email) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', email.toLowerCase())
        .maybeSingle()
      
      if (userData) {
        user = userData
      }
    }

    // If user not found, we can still track the signup
    // but won't create a subscription record
    if (!user) {
      console.log('Free plan signup tracked (user not found):', { userId, email, plan })
      
      // Log activity anyway
      try {
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'user.free_plan.activated',
          resource_type: 'subscription',
          resource_id: null,
          user_id: null,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            plan: plan,
            email: email,
            user_id: userId,
            note: 'User not found in database'
          }
        })
      } catch (logError) {
        console.warn('Failed to log free plan activity:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'Free plan signup tracked (user not found)',
        tracked: false,
        userFound: false
      })
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id, status, plan')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If user already has an active subscription, don't create a new one
    if (existingSubscription) {
      console.log('User already has active subscription:', existingSubscription)
      
      // Log activity
      try {
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'user.free_plan.activated',
          resource_type: 'subscription',
          resource_id: existingSubscription.id,
          user_id: user.id,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            plan: plan,
            existing_subscription: true,
            existing_status: existingSubscription.status
          }
        })
      } catch (logError) {
        console.warn('Failed to log free plan activity:', logError)
      }

      return NextResponse.json({
        success: true,
        message: 'User already has an active subscription',
        tracked: true,
        subscriptionId: existingSubscription.id,
        existing: true
      })
    }

    // Create free plan subscription
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month free plan

    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: 'starter', // Map free plan to starter
        status: 'trialing', // Free plan is treated as trialing
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Failed to create free plan subscription:', subscriptionError)
      
      // Still log the activity
      try {
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'user.free_plan.activated',
          resource_type: 'subscription',
          resource_id: null,
          user_id: user.id,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            plan: plan,
            error: subscriptionError.message,
            subscription_creation_failed: true
          }
        })
      } catch (logError) {
        console.warn('Failed to log free plan activity:', logError)
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create subscription',
        details: subscriptionError.message
      }, { status: 500 })
    }

    // Create payment record for tracking (amount = 0 for free plan)
    await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount: '0.00',
        currency: 'USD',
        status: 'completed',
        payment_method: 'free_plan',
        transaction_id: `free_${subscription.id}`,
        metadata: {
          plan: plan,
          business_pays: true
        }
      })

    // Log activity
    try {
      await logActivity(supabaseUrl, serviceRoleKey, {
        action: 'user.free_plan.activated',
        resource_type: 'subscription',
        resource_id: subscription.id,
        user_id: user.id,
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
        metadata: {
          plan: plan,
          subscription_id: subscription.id,
          business_pays: true
        }
      })
    } catch (logError) {
      console.warn('Failed to log free plan activity:', logError)
    }

    console.log('✅ Free plan signup tracked and subscription created:', {
      userId: user.id,
      email: user.email,
      subscriptionId: subscription.id
    })

    return NextResponse.json({
      success: true,
      message: 'Free plan signup tracked successfully',
      tracked: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status
      }
    })
  } catch (error: any) {
    console.error('Error tracking free plan signup:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track free plan signup',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// Allow GET for health check
export async function GET() {
  return NextResponse.json({
    message: 'Free plan tracking endpoint is active',
    timestamp: new Date().toISOString()
  })
}

