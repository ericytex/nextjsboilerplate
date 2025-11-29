/**
 * Creem.io Products API Routes
 * POST /api/creem/products - Create a product
 * GET /api/creem/products - Get a product or list products
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCreemClientFromEnv } from '@/lib/creem-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import type { CreateProductRequest, ListProductsRequest } from '@/types/creem'

export async function POST(request: NextRequest) {
  try {
    const client = getCreemClientFromEnv()
    const body: CreateProductRequest = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }
    if (!body.price || body.price < 100) {
      return NextResponse.json(
        { error: 'price must be at least 100 cents (minimum $1.00)' },
        { status: 400 }
      )
    }
    if (!body.currency) {
      return NextResponse.json(
        { error: 'currency is required (e.g., "USD")' },
        { status: 400 }
      )
    }
    if (!body.billing_type || !['recurring', 'onetime'].includes(body.billing_type)) {
      return NextResponse.json(
        { error: 'billing_type is required and must be "recurring" or "onetime"' },
        { status: 400 }
      )
    }
    if (body.billing_type === 'recurring' && !body.billing_period) {
      return NextResponse.json(
        { error: 'billing_period is required when billing_type is "recurring" (e.g., "every-month")' },
        { status: 400 }
      )
    }

    const product = await client.createProduct(body)

    // Log product creation
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const requestInfo = extractRequestInfo(request)
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: 'creem.product.created',
          resource_type: 'product',
          resource_id: product.id,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            product_name: product.name,
            price: product.price,
            currency: product.currency,
            billing_type: product.billing_type
          }
        })
      }
    } catch (logError) {
      console.warn('⚠️ Failed to log product creation activity (non-critical):', logError)
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error: any) {
    console.error('Creem product creation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'PRODUCT_ERROR',
          message: error.message || 'Failed to create product',
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
    const productId = searchParams.get('productId') || searchParams.get('id')

    // If productId is provided, get single product
    if (productId) {
      const product = await client.getProduct(productId)
      return NextResponse.json({
        success: true,
        data: product,
      })
    }

    // Otherwise, list products
    const listRequest: ListProductsRequest = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      search: searchParams.get('search') || undefined,
    }

    const products = await client.listProducts(listRequest)

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error: any) {
    console.error('Creem product retrieval error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code || 'PRODUCT_ERROR',
          message: error.message || 'Failed to get product(s)',
          details: error.details,
        },
      },
      { status: error.statusCode || 500 }
    )
  }
}

