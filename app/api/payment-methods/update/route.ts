/**
 * Update Payment Method
 * POST /api/payment-methods/update
 * Creates a checkout session for updating payment method
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCreemClientFromEnv } from '@/lib/creem-client'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import { createSupabaseClient } from '@/lib/supabase-client'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { subscriptionId, productId } = body

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

    // Get user information
    let userEmail: string | null = null
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .maybeSingle()
      
      if (user) {
        userEmail = user.email
      }
    }

    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get subscription to find product ID if not provided
    let finalProductId = productId
    if (!finalProductId && subscriptionId) {
      // Try to get product ID from subscription metadata or use a default
      // Since we store subscriptions locally, we might need to get it from Creem
      // For now, we'll use the product ID from environment or require it
      finalProductId = process.env.CREEM_BASIC_PRODUCT_ID || 
                      process.env.CREEM_PRO_PRODUCT_ID || 
                      process.env.CREEM_BUSINESS_PRODUCT_ID
    }

    if (!finalProductId) {
      // Get user's current subscription to determine product
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subscription) {
        // Map plan to product ID
        const planProductMap: Record<string, string> = {
          'starter': process.env.CREEM_BASIC_PRODUCT_ID || '',
          'pro': process.env.CREEM_PRO_PRODUCT_ID || '',
          'business': process.env.CREEM_BUSINESS_PRODUCT_ID || ''
        }
        finalProductId = planProductMap[subscription.plan] || process.env.CREEM_BASIC_PRODUCT_ID
      }
    }

    if (!finalProductId) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required. Please set CREEM_BASIC_PRODUCT_ID or provide productId in request.'
      }, { status: 400 })
    }

    // Check if Creem.io is configured
    const creemApiKey = process.env.CREEM_API_KEY
    if (!creemApiKey) {
      return NextResponse.json({
        success: false,
        error: 'Creem.io is not configured. Please set CREEM_API_KEY environment variable.'
      }, { status: 503 })
    }

    try {
      const creemClient = getCreemClientFromEnv()
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                     'http://localhost:3000'

      // Create checkout session for updating payment method
      // Note: Creem.io may handle this through a customer portal or checkout update
      // This creates a new checkout that can be used to update payment method
      const checkout = await creemClient.createCheckout({
        productId: finalProductId,
        customerEmail: userEmail,
        successUrl: `${baseUrl}/dashboard/settings/payments?updated=true`,
        cancelUrl: `${baseUrl}/dashboard/settings/payments`,
        metadata: {
          action: 'update_payment_method',
          userId: userId,
          subscriptionId: subscriptionId
        }
      })

      // Log activity
      const requestInfo = extractRequestInfo(request)
      await logActivity(supabaseUrl, serviceRoleKey, {
        action: 'payment_method.update_initiated',
        resource_type: 'payment_method',
        resource_id: checkout.id,
        user_id: userId,
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
        metadata: {
          checkout_id: checkout.id,
          product_id: finalProductId,
          subscription_id: subscriptionId
        }
      })

      return NextResponse.json({
        success: true,
        checkoutUrl: checkout.checkoutUrl,
        checkoutId: checkout.id,
        message: 'Checkout session created. Redirect user to checkoutUrl to update payment method.'
      })
    } catch (creemError: any) {
      console.error('Creem.io checkout creation error:', creemError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create checkout session',
        details: creemError.message
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error creating payment method update checkout:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate payment method update',
        details: error.message
      },
      { status: 500 }
    )
  }
}




