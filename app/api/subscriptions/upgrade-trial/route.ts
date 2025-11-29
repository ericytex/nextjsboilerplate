/**
 * Auto Upgrade Trial to Basic Plan
 * POST /api/subscriptions/upgrade-trial
 * 
 * Automatically upgrades users from trial to basic plan when trial expires.
 * Optionally integrates with Creem.io to create checkout sessions.
 * 
 * This endpoint can be called:
 * - Manually by admin
 * - Via cron job (e.g., Vercel Cron, GitHub Actions, etc.)
 * - On-demand when user logs in
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import { getCreemClientFromEnv } from '@/lib/creem-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { 
      gracePeriodHours = 24, // Upgrade trials that expired within last 24 hours
      createCreemCheckout = false, // Optionally create Creem.io checkout
      dryRun = false // If true, only report what would be upgraded
    } = body

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        message: 'Database connection required for trial upgrades'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const requestInfo = extractRequestInfo(request)

    // Calculate cutoff time (trials that expired within grace period)
    const now = new Date()
    const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000
    const cutoffTime = new Date(now.getTime() - gracePeriodMs)

    // Find all trialing subscriptions that have expired or are about to expire
    const { data: expiringTrials, error: queryError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan,
        status,
        current_period_end,
        created_at,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('status', 'trialing')
      .lte('current_period_end', now.toISOString()) // Expired or expiring now
      .gte('current_period_end', cutoffTime.toISOString()) // Within grace period
      .order('current_period_end', { ascending: true })

    if (queryError) {
      console.error('Error querying expiring trials:', queryError)
      return NextResponse.json({
        success: false,
        error: 'Failed to query subscriptions',
        details: queryError.message
      }, { status: 500 })
    }

    if (!expiringTrials || expiringTrials.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expiring trials found',
        upgraded: [],
        count: 0,
        dryRun
      })
    }

    const upgraded: Array<{
      subscriptionId: string
      userId: string
      email: string
      oldPlan: string
      newPlan: string
      checkoutUrl?: string
    }> = []

    const errors: Array<{
      subscriptionId: string
      userId: string
      error: string
    }> = []

    // Process each expiring trial
    for (const subscription of expiringTrials) {
      try {
        const userId = subscription.user_id
        const subscriptionId = subscription.id
        const user = subscription.users as any
        const userEmail = user?.email || 'unknown'
        const oldPlan = subscription.plan

        if (dryRun) {
          // Just report what would be upgraded
          upgraded.push({
            subscriptionId,
            userId,
            email: userEmail,
            oldPlan,
            newPlan: 'starter'
          })
          continue
        }

        // Update subscription to basic plan (starter in database)
        const newPeriodStart = new Date()
        const newPeriodEnd = new Date()
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1) // 1 month billing cycle

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            plan: 'starter', // Basic plan maps to 'starter' in database
            status: 'active',
            current_period_start: newPeriodStart.toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
            cancel_at_period_end: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscriptionId)

        if (updateError) {
          console.error(`Failed to upgrade subscription ${subscriptionId}:`, updateError)
          errors.push({
            subscriptionId,
            userId,
            error: updateError.message
          })
          continue
        }

        // Optionally create Creem.io checkout session
        let checkoutUrl: string | undefined
        if (createCreemCheckout) {
          try {
            // Check if Creem is configured
            const creemApiKey = process.env.CREEM_API_KEY
            if (!creemApiKey) {
              console.warn('CREEM_API_KEY not set, skipping checkout creation')
            } else {
              const creemClient = getCreemClientFromEnv()
              
              // Get basic plan product ID from environment or config
              const basicProductId = process.env.CREEM_BASIC_PRODUCT_ID
              
              if (basicProductId) {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                               process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                               'http://localhost:3000'

                const checkout = await creemClient.createCheckout({
                  productId: basicProductId,
                  customerEmail: userEmail,
                  successUrl: `${baseUrl}/success?plan=basic`,
                  cancelUrl: `${baseUrl}/cancel`
                })

                checkoutUrl = checkout.checkoutUrl

                // Log checkout creation
                await logActivity(supabaseUrl, serviceRoleKey, {
                  action: 'subscription.trial_upgrade.checkout_created',
                  resource_type: 'subscription',
                  resource_id: subscriptionId,
                  user_id: userId,
                  ip_address: requestInfo.ip_address,
                  user_agent: requestInfo.user_agent,
                  metadata: {
                    old_plan: oldPlan,
                    new_plan: 'starter',
                    checkout_url: checkoutUrl
                  }
                })
              } else {
                console.warn(`CREEM_BASIC_PRODUCT_ID not set, skipping checkout creation for ${userEmail}`)
              }
            }
          } catch (creemError: any) {
            console.warn(`Failed to create Creem checkout for ${userEmail}:`, creemError.message)
            // Don't fail the upgrade if checkout creation fails
          }
        }

        // Log the upgrade activity
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'subscription.trial_upgraded',
          resource_type: 'subscription',
          resource_id: subscriptionId,
          user_id: userId,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            old_plan: oldPlan,
            new_plan: 'starter',
            checkout_url: checkoutUrl,
            auto_upgrade: true
          }
        })

        upgraded.push({
          subscriptionId,
          userId,
          email: userEmail,
          oldPlan,
          newPlan: 'starter',
          checkoutUrl
        })

        console.log(`✅ Upgraded trial subscription ${subscriptionId} for user ${userEmail}`)
      } catch (error: any) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        errors.push({
          subscriptionId: subscription.id,
          userId: subscription.user_id,
          error: error.message || 'Unknown error'
        })
      }
    }

    // Log the batch operation
    await logActivity(supabaseUrl, serviceRoleKey, {
      action: 'subscription.trial_upgrade.batch',
      resource_type: 'subscription',
      resource_id: null,
      user_id: null,
      ip_address: requestInfo.ip_address,
      user_agent: requestInfo.user_agent,
      metadata: {
        total_found: expiringTrials.length,
        upgraded_count: upgraded.length,
        error_count: errors.length,
        grace_period_hours: gracePeriodHours,
        create_creem_checkout: createCreemCheckout,
        dry_run: dryRun
      }
    })

    return NextResponse.json({
      success: true,
      message: dryRun 
        ? `Found ${expiringTrials.length} trials that would be upgraded`
        : `Upgraded ${upgraded.length} of ${expiringTrials.length} expiring trials`,
      upgraded,
      errors: errors.length > 0 ? errors : undefined,
      count: upgraded.length,
      total: expiringTrials.length,
      dryRun
    })
  } catch (error: any) {
    console.error('Error upgrading trials:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upgrade trials',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// GET endpoint for checking expiring trials without upgrading
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gracePeriodHours = parseInt(searchParams.get('gracePeriodHours') || '24')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured'
      }, { status: 503 })
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const now = new Date()
    const gracePeriodMs = gracePeriodHours * 60 * 60 * 1000
    const cutoffTime = new Date(now.getTime() - gracePeriodMs)

    const { data: expiringTrials, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        user_id,
        plan,
        status,
        current_period_end,
        created_at,
        users:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('status', 'trialing')
      .lte('current_period_end', now.toISOString())
      .gte('current_period_end', cutoffTime.toISOString())
      .order('current_period_end', { ascending: true })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to query subscriptions',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: expiringTrials?.length || 0,
      trials: expiringTrials || [],
      gracePeriodHours
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check expiring trials',
        details: error.message
      },
      { status: 500 }
    )
  }
}

