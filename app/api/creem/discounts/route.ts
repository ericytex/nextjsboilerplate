/**
 * Creem.io Discount Code API Routes
 * POST /api/creem/discounts - Create a discount code
 * GET /api/creem/discounts - Get a discount code
 * DELETE /api/creem/discounts - Delete a discount code
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCreemClientFromEnv } from '@/lib/creem-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import type {
  CreateDiscountRequest,
  GetDiscountRequest,
  DeleteDiscountRequest,
} from '@/types/creem'

export async function POST(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const body: CreateDiscountRequest = await request.json()

    // Validate required fields
    if (!body.code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400 }
      )
    }
    if (!body.type || !['percentage', 'fixed'].includes(body.type)) {
      return NextResponse.json(
        { error: 'type must be "percentage" or "fixed"' },
        { status: 400 }
      )
    }
    if (!body.value || body.value <= 0) {
      return NextResponse.json(
        { error: 'value must be a positive number' },
        { status: 400 }
      )
    }

    const discount = await client.createDiscount(body)

    // Log discount creation
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const requestInfo = extractRequestInfo(request)
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'creem.discount.created',
          resource_type: 'discount',
          resource_id: discount.id,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            code: discount.code,
            type: discount.type,
            value: discount.value
          }
        })
      }
    } catch (logError) {
      console.warn('⚠️ Failed to log discount creation (non-critical):', logError)
    }

    return NextResponse.json({
      success: true,
      data: discount,
    })
  } catch (error: any) {
    console.error('Creem discount creation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'DISCOUNT_ERROR',
          message: error.message || 'Failed to create discount code',
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
    const discountId = searchParams.get('discountId') || searchParams.get('id')

    if (!discountId) {
      return NextResponse.json(
        { error: 'discountId is required' },
        { status: 400 }
      )
    }

    const discount = await client.getDiscount({ discountId })

    return NextResponse.json({
      success: true,
      data: discount,
    })
  } catch (error: any) {
    console.error('Creem discount retrieval error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'DISCOUNT_ERROR',
          message: error.message || 'Failed to get discount code',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const searchParams = request.nextUrl.searchParams
    const discountId = searchParams.get('discountId') || searchParams.get('id')

    if (!discountId) {
      return NextResponse.json(
        { error: 'discountId is required' },
        { status: 400 }
      )
    }

    await client.deleteDiscount({ discountId })

    // Log discount deletion
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const requestInfo = extractRequestInfo(request)
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'creem.discount.deleted',
          resource_type: 'discount',
          resource_id: discountId,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            discount_id: discountId
          }
        })
      }
    } catch (logError) {
      console.warn('⚠️ Failed to log discount deletion (non-critical):', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Discount code deleted successfully',
    })
  } catch (error: any) {
    console.error('Creem discount deletion error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'DISCOUNT_ERROR',
          message: error.message || 'Failed to delete discount code',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

