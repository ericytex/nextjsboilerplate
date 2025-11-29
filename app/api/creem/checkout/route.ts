/**
 * Creem.io Checkout API Routes
 * POST /api/creem/checkout - Create a checkout session
 * GET /api/creem/checkout - Get a checkout session
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCreemClientFromEnv } from '@/lib/creem-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import type { CreateCheckoutRequest, GetCheckoutRequest } from '@/types/creem'

export async function POST(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const body: CreateCheckoutRequest = await request.json()

    // Validate required fields
    if (!body.productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    const checkout = await client.createCheckout(body)

    // Log checkout creation
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const requestInfo = extractRequestInfo(request)
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'creem.checkout.created',
          resource_type: 'checkout',
          resource_id: checkout.id,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            product_id: body.productId,
            checkout_id: checkout.id,
            success_url: body.successUrl,
            cancel_url: body.cancelUrl
          }
        })
      }
    } catch (logError) {
      console.warn('⚠️ Failed to log checkout creation activity (non-critical):', logError)
    }

    return NextResponse.json({
      success: true,
      data: checkout,
    })
  } catch (error: any) {
    console.error('Creem checkout creation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'CHECKOUT_ERROR',
          message: error.message || 'Failed to create checkout session',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const searchParams = request.nextUrl.searchParams
    const checkoutId = searchParams.get('checkoutId') || searchParams.get('id')

    if (!checkoutId) {
      return NextResponse.json(
        { error: 'checkoutId is required' },
        { status: 400 }
      )
    }

    const checkout = await client.getCheckout({ checkoutId })

    // Log checkout retrieval
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const requestInfo = extractRequestInfo(request)
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'creem.checkout.retrieved',
          resource_type: 'checkout',
          resource_id: checkoutId,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            checkout_id: checkoutId,
            status: checkout.status,
            product_id: checkout.productId
          }
        })
      }
    } catch (logError) {
      console.warn('⚠️ Failed to log checkout retrieval activity (non-critical):', logError)
    }

    return NextResponse.json({
      success: true,
      data: checkout,
    })
  } catch (error: any) {
    console.error('Creem checkout retrieval error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'CHECKOUT_ERROR',
          message: error.message || 'Failed to get checkout session',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

