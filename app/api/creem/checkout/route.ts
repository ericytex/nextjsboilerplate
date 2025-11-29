/**
 * Creem.io Checkout API Routes
 * POST /api/creem/checkout - Create a checkout session
 * GET /api/creem/checkout - Get a checkout session
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCreemClientFromEnv } from '@/lib/creem-client'
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

