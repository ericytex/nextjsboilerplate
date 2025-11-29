/**
 * Creem.io Subscription API Routes
 * GET /api/creem/subscriptions - Get a subscription
 * POST /api/creem/subscriptions - Update, cancel, or upgrade a subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCreemClientFromEnv } from '@/lib/creem-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import type {
  GetSubscriptionRequest,
  CancelSubscriptionRequest,
  UpdateSubscriptionRequest,
  UpgradeSubscriptionRequest,
} from '@/types/creem'

export async function GET(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const searchParams = request.nextUrl.searchParams
    const subscriptionId = searchParams.get('subscriptionId') || searchParams.get('id')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      )
    }

    const subscription = await client.getSubscription({ subscriptionId })

    return NextResponse.json({
      success: true,
      data: subscription,
    })
  } catch (error: any) {
    console.error('Creem subscription retrieval error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'SUBSCRIPTION_ERROR',
          message: error.message || 'Failed to get subscription',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') // 'cancel', 'update', or 'upgrade'
    const body = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'action parameter is required (cancel, update, or upgrade)' },
        { status: 400 }
      )
    }

    const subscriptionId = body.subscriptionId || searchParams.get('subscriptionId') || searchParams.get('id')
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'cancel': {
        const cancelRequest: CancelSubscriptionRequest = {
          subscriptionId,
          cancelImmediately: body.cancelImmediately,
          reason: body.reason,
        }
        const subscription = await client.cancelSubscription(cancelRequest)
        
        // Log subscription cancellation
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseUrl && serviceRoleKey) {
            const requestInfo = extractRequestInfo(request)
            await logActivity(supabaseUrl, serviceRoleKey, {
              action: 'creem.subscription.cancelled',
              resource_type: 'subscription',
              resource_id: subscriptionId,
              ip_address: requestInfo.ip_address,
              user_agent: requestInfo.user_agent,
              metadata: {
                cancel_immediately: body.cancelImmediately,
                reason: body.reason
              }
            })
          }
        } catch (logError) {
          console.warn('⚠️ Failed to log subscription cancellation (non-critical):', logError)
        }

        return NextResponse.json({
          success: true,
          data: subscription,
        })
      }

      case 'update': {
        const updateRequest: UpdateSubscriptionRequest = {
          subscriptionId,
          metadata: body.metadata,
          cancelAtPeriodEnd: body.cancelAtPeriodEnd,
        }
        const subscription = await client.updateSubscription(updateRequest)
        
        // Log subscription update
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
          const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          if (supabaseUrl && serviceRoleKey) {
            const requestInfo = extractRequestInfo(request)
            await logActivity(supabaseUrl, serviceRoleKey, {
              action: 'creem.subscription.updated',
              resource_type: 'subscription',
              resource_id: subscriptionId,
              ip_address: requestInfo.ip_address,
              user_agent: requestInfo.user_agent,
              metadata: {
                cancel_at_period_end: body.cancelAtPeriodEnd,
                has_metadata: !!body.metadata
              }
            })
          }
        } catch (logError) {
          console.warn('⚠️ Failed to log subscription update (non-critical):', logError)
        }

        return NextResponse.json({
          success: true,
          data: subscription,
        })
      }

      case 'upgrade': {
        const upgradeRequest: UpgradeSubscriptionRequest = {
          subscriptionId,
          newProductId: body.newProductId,
          prorate: body.prorate,
        }
        if (!upgradeRequest.newProductId) {
          return NextResponse.json(
            { error: 'newProductId is required for upgrade' },
            { status: 400 }
          )
        }
        const subscription = await client.upgradeSubscription(upgradeRequest)
        return NextResponse.json({
          success: true,
          data: subscription,
        })
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be 'cancel', 'update', or 'upgrade'` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Creem subscription operation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'SUBSCRIPTION_ERROR',
          message: error.message || 'Failed to process subscription operation',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

