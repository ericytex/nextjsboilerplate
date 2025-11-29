/**
 * Creem.io Webhook Handler
 * POST /api/webhooks/creem
 * Handles payment events, subscription updates, and license activations
 * Documentation: https://docs.creem.io/api-reference/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import type { WebhookEvent, WebhookEventType } from '@/types/creem'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import { createSupabaseClient } from '@/lib/supabase-client'
import * as crypto from 'crypto'

/**
 * Verify webhook signature using HMAC-SHA256
 * Creem.io uses HMAC-SHA256 to sign webhook payloads
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Remove 'sha256=' prefix if present
    const signatureWithoutPrefix = signature.replace(/^sha256=/, '')
    
    // Create HMAC hash
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex')
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signatureWithoutPrefix, 'hex')
    )
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

/**
 * Get or create user by email
 */
async function getOrCreateUserByEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  email: string,
  name?: string
): Promise<{ id: string; created: boolean } | null> {
  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    
    // Try to find existing user
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    
    if (existingUser) {
      return { id: existingUser.id, created: false }
    }
    
    // User doesn't exist, create new one
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        full_name: name || email.split('@')[0],
        role: 'user',
        email_verified: true // Verified via payment
      })
      .select('id')
      .single()
    
    if (createError || !newUser) {
      console.error('Failed to create user:', createError)
      return null
    }
    
    // Create default settings
    await supabase
      .from('user_settings')
      .insert({
        user_id: newUser.id,
        settings: {}
      })
    
    return { id: newUser.id, created: true }
  } catch (error) {
    console.error('Error in getOrCreateUserByEmail:', error)
    return null
  }
}

/**
 * Map Creem plan to database plan
 */
function mapPlanToDatabasePlan(planName: string): string {
  const planMap: Record<string, string> = {
    'basic': 'starter',
    'pro': 'pro',
    'business': 'business',
    'enterprise': 'enterprise',
    'free': 'starter'
  }
  
  const lowerPlan = planName.toLowerCase()
  return planMap[lowerPlan] || 'starter'
}

/**
 * Handle webhook events
 */
async function handleWebhookEvent(event: WebhookEvent) {
  console.log(`Processing Creem webhook event: ${event.type}`, event.data)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('⚠️ Supabase not configured - webhook handlers will be limited')
    return
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)

  switch (event.type) {
    case 'checkout.completed':
      await handleCheckoutCompleted(event.data, supabase, supabaseUrl, serviceRoleKey)
      break

    case 'checkout.expired':
      await handleCheckoutExpired(event.data, supabase)
      break

    case 'subscription.created':
      await handleSubscriptionCreated(event.data, supabase, supabaseUrl, serviceRoleKey)
      break

    case 'subscription.updated':
      await handleSubscriptionUpdated(event.data, supabase)
      break

    case 'subscription.cancelled':
      await handleSubscriptionCancelled(event.data, supabase)
      break

    case 'subscription.renewed':
      await handleSubscriptionRenewed(event.data, supabase)
      break

    case 'license.activated':
      await handleLicenseActivated(event.data, supabase)
      break

    case 'license.deactivated':
      await handleLicenseDeactivated(event.data, supabase)
      break

    case 'transaction.completed':
      await handleTransactionCompleted(event.data, supabase, supabaseUrl, serviceRoleKey)
      break

    case 'transaction.failed':
      await handleTransactionFailed(event.data, supabase)
      break

    case 'refund.processed':
      await handleRefundProcessed(event.data, supabase)
      break

    default:
      console.warn(`Unknown webhook event type: ${event.type}`)
  }
}

// Event handlers with business logic

async function handleCheckoutCompleted(
  data: any,
  supabase: any,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  try {
    console.log('Checkout completed:', data)
    
    const customerEmail = data.customerEmail || data.customer?.email
    const customerName = data.customerName || data.customer?.name
    const productId = data.productId
    const checkoutId = data.checkoutId || data.id
    const amount = data.amount
    const currency = data.currency || 'USD'
    
    if (!customerEmail) {
      console.error('No customer email in checkout data')
      return
    }
    
    // Get or create user
    const userResult = await getOrCreateUserByEmail(
      supabaseUrl,
      serviceRoleKey,
      customerEmail,
      customerName
    )
    
    if (!userResult) {
      console.error('Failed to get or create user for checkout')
      return
    }
    
    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userResult.id,
        amount: amount ? (amount / 100).toFixed(2) : '0.00', // Convert cents to dollars
        currency: currency,
        status: 'completed',
        transaction_id: checkoutId,
        payment_method: data.paymentMethod || 'creem',
        metadata: data
      })
    
    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
    }
    
    console.log('✅ Checkout completed and payment recorded')
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}

async function handleCheckoutExpired(data: any, supabase: any) {
  try {
    console.log('Checkout expired:', data)
    
    const checkoutId = data.checkoutId || data.id
    
    // Update payment status if exists
    if (checkoutId) {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('transaction_id', checkoutId)
    }
    
    console.log('✅ Checkout expired handled')
  } catch (error) {
    console.error('Error handling checkout expired:', error)
  }
}

async function handleSubscriptionCreated(
  data: any,
  supabase: any,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  try {
    console.log('Subscription created:', data)
    
    const customerEmail = data.customerEmail || data.customer?.email
    const customerName = data.customerName || data.customer?.name
    const subscriptionId = data.id || data.subscriptionId
    const productId = data.productId
    const status = data.status || 'active'
    const currentPeriodStart = data.currentPeriodStart
    const currentPeriodEnd = data.currentPeriodEnd
    const cancelAtPeriodEnd = data.cancelAtPeriodEnd || false
    const trialStart = data.trialStart
    const trialEnd = data.trialEnd
    
    if (!customerEmail) {
      console.error('No customer email in subscription data')
      return
    }
    
    // Get or create user
    const userResult = await getOrCreateUserByEmail(
      supabaseUrl,
      serviceRoleKey,
      customerEmail,
      customerName
    )
    
    if (!userResult) {
      console.error('Failed to get or create user for subscription')
      return
    }
    
    // Determine plan from product or metadata
    const planName = data.plan || data.metadata?.plan || 'starter'
    const plan = mapPlanToDatabasePlan(planName)
    
    // Determine subscription status
    let subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' = 'active'
    if (trialStart && trialEnd) {
      subscriptionStatus = 'trialing'
    } else if (status === 'cancelled' || status === 'canceled') {
      subscriptionStatus = 'canceled'
    } else if (status === 'past_due') {
      subscriptionStatus = 'past_due'
    }
    
    // Create subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userResult.id,
        plan: plan,
        status: subscriptionStatus,
        billing_cycle: data.billingCycle || 'monthly',
        current_period_start: currentPeriodStart ? new Date(currentPeriodStart).toISOString() : null,
        current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
        cancel_at_period_end: cancelAtPeriodEnd
      })
    
    if (subscriptionError) {
      console.error('Failed to create subscription record:', subscriptionError)
    } else {
      console.log('✅ Subscription created and recorded')
    }
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(data: any, supabase: any) {
  try {
    console.log('Subscription updated:', data)
    
    const subscriptionId = data.id || data.subscriptionId
    const customerEmail = data.customerEmail || data.customer?.email
    
    if (!subscriptionId && !customerEmail) {
      console.error('No subscription ID or customer email in update data')
      return
    }
    
    // Find user by email if subscription ID not available
    let userId: string | null = null
    if (customerEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail.toLowerCase())
        .maybeSingle()
      
      if (user) userId = user.id
    }
    
    // Update subscription
    const updateData: any = {}
    if (data.status) {
      const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'trialing'> = {
        'active': 'active',
        'cancelled': 'canceled',
        'canceled': 'canceled',
        'past_due': 'past_due',
        'trialing': 'trialing'
      }
      updateData.status = statusMap[data.status] || 'active'
    }
    if (data.currentPeriodStart) {
      updateData.current_period_start = new Date(data.currentPeriodStart).toISOString()
    }
    if (data.currentPeriodEnd) {
      updateData.current_period_end = new Date(data.currentPeriodEnd).toISOString()
    }
    if (data.cancelAtPeriodEnd !== undefined) {
      updateData.cancel_at_period_end = data.cancelAtPeriodEnd
    }
    if (data.plan) {
      updateData.plan = mapPlanToDatabasePlan(data.plan)
    }
    
    updateData.updated_at = new Date().toISOString()
    
    // Update by subscription ID (if we can map it) or by user_id
    if (subscriptionId) {
      // Try to find subscription by metadata or external ID
      // Since we don't store Creem subscription ID directly, update by user_id
      if (userId) {
        await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
      }
    } else if (userId) {
      await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
    }
    
    console.log('✅ Subscription updated')
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionCancelled(data: any, supabase: any) {
  try {
    console.log('Subscription cancelled:', data)
    
    const customerEmail = data.customerEmail || data.customer?.email
    
    if (!customerEmail) {
      console.error('No customer email in cancellation data')
      return
    }
    
    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail.toLowerCase())
      .maybeSingle()
    
    if (!user) {
      console.error('User not found for subscription cancellation')
      return
    }
    
    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: data.cancelAtPeriodEnd || false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    
    console.log('✅ Subscription cancelled')
  } catch (error) {
    console.error('Error handling subscription cancelled:', error)
  }
}

async function handleSubscriptionRenewed(data: any, supabase: any) {
  try {
    console.log('Subscription renewed:', data)
    
    const customerEmail = data.customerEmail || data.customer?.email
    
    if (!customerEmail) {
      console.error('No customer email in renewal data')
      return
    }
    
    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail.toLowerCase())
      .maybeSingle()
    
    if (!user) {
      console.error('User not found for subscription renewal')
      return
    }
    
    // Update subscription period
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: data.currentPeriodStart ? new Date(data.currentPeriodStart).toISOString() : null,
        current_period_end: data.currentPeriodEnd ? new Date(data.currentPeriodEnd).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
    
    console.log('✅ Subscription renewed')
  } catch (error) {
    console.error('Error handling subscription renewed:', error)
  }
}

async function handleLicenseActivated(data: any, supabase: any) {
  try {
    console.log('License activated:', data)
    
    const licenseKey = data.licenseKey
    const customerEmail = data.customerEmail || data.customer?.email
    
    if (!customerEmail) {
      console.error('No customer email in license activation data')
      return
    }
    
    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail.toLowerCase())
      .maybeSingle()
    
    if (!user) {
      console.error('User not found for license activation')
      return
    }
    
    // Store license in user settings or metadata
    // You can extend this to create a licenses table if needed
    await supabase
      .from('user_settings')
      .update({
        settings: {
          license_key: licenseKey?.substring(0, 8) + '...', // Store partial key
          license_activated: true,
          license_activated_at: new Date().toISOString()
        }
      })
      .eq('user_id', user.id)
    
    console.log('✅ License activated')
  } catch (error) {
    console.error('Error handling license activated:', error)
  }
}

async function handleLicenseDeactivated(data: any, supabase: any) {
  try {
    console.log('License deactivated:', data)
    
    const customerEmail = data.customerEmail || data.customer?.email
    
    if (!customerEmail) {
      console.error('No customer email in license deactivation data')
      return
    }
    
    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail.toLowerCase())
      .maybeSingle()
    
    if (!user) {
      console.error('User not found for license deactivation')
      return
    }
    
    // Update user settings
    await supabase
      .from('user_settings')
      .update({
        settings: {
          license_activated: false,
          license_deactivated_at: new Date().toISOString()
        }
      })
      .eq('user_id', user.id)
    
    console.log('✅ License deactivated')
  } catch (error) {
    console.error('Error handling license deactivated:', error)
  }
}

async function handleTransactionCompleted(
  data: any,
  supabase: any,
  supabaseUrl: string,
  serviceRoleKey: string
) {
  try {
    console.log('Transaction completed:', data)
    
    const customerEmail = data.customerEmail || data.customer?.email
    const transactionId = data.id || data.transactionId
    const amount = data.amount
    const currency = data.currency || 'USD'
    const subscriptionId = data.subscriptionId
    const checkoutId = data.checkoutId
    
    if (!customerEmail) {
      console.error('No customer email in transaction data')
      return
    }
    
    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail.toLowerCase())
      .maybeSingle()
    
    if (!user) {
      console.error('User not found for transaction')
      return
    }
    
    // Find subscription if subscriptionId provided
    let dbSubscriptionId: string | null = null
    if (subscriptionId) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (subscription) {
        dbSubscriptionId = subscription.id
      }
    }
    
    // Create or update payment record
    const paymentData = {
      user_id: user.id,
      subscription_id: dbSubscriptionId,
      amount: amount ? (amount / 100).toFixed(2) : '0.00', // Convert cents to dollars
      currency: currency,
      status: 'completed' as const,
      transaction_id: transactionId,
      payment_method: data.paymentMethod || 'creem'
    }
    
    // Try to update existing payment first
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('transaction_id', transactionId)
      .maybeSingle()
    
    if (existingPayment) {
      await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', existingPayment.id)
    } else {
      await supabase
        .from('payments')
        .insert(paymentData)
    }
    
    console.log('✅ Transaction completed and payment recorded')
  } catch (error) {
    console.error('Error handling transaction completed:', error)
  }
}

async function handleTransactionFailed(data: any, supabase: any) {
  try {
    console.log('Transaction failed:', data)
    
    const transactionId = data.id || data.transactionId
    const customerEmail = data.customerEmail || data.customer?.email
    
    if (!transactionId && !customerEmail) {
      console.error('No transaction ID or customer email in failure data')
      return
    }
    
    // Update payment status
    if (transactionId) {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('transaction_id', transactionId)
    } else if (customerEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail.toLowerCase())
        .maybeSingle()
      
      if (user) {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      }
    }
    
    console.log('✅ Transaction failure recorded')
  } catch (error) {
    console.error('Error handling transaction failed:', error)
  }
}

async function handleRefundProcessed(data: any, supabase: any) {
  try {
    console.log('Refund processed:', data)
    
    const transactionId = data.transactionId || data.id
    const customerEmail = data.customerEmail || data.customer?.email
    
    if (!transactionId && !customerEmail) {
      console.error('No transaction ID or customer email in refund data')
      return
    }
    
    // Update payment status to refunded
    if (transactionId) {
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('transaction_id', transactionId)
    } else if (customerEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail.toLowerCase())
        .maybeSingle()
      
      if (user) {
        await supabase
          .from('payments')
          .update({ status: 'refunded' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      }
    }
    
    // Optionally cancel subscription if refund is for subscription
    if (data.subscriptionId && customerEmail) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', customerEmail.toLowerCase())
        .maybeSingle()
      
      if (user) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
      }
    }
    
    console.log('✅ Refund processed and records updated')
  } catch (error) {
    console.error('Error handling refund processed:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers (if provided)
    const signature = request.headers.get('x-creem-signature') || 
                     request.headers.get('x-signature') ||
                     request.headers.get('x-webhook-signature') ||
                     request.headers.get('authorization')?.replace('Bearer ', '')

    // Get webhook secret from environment
    const webhookSecret = process.env.CREEM_WEBHOOK_SECRET

    // Read the raw body for signature verification
    const body = await request.text()
    let event: WebhookEvent

    try {
      event = JSON.parse(body) as WebhookEvent
    } catch (parseError) {
      console.error('Failed to parse webhook payload:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    } else if (webhookSecret && !signature) {
      // If secret is configured but no signature provided, reject
      console.error('Webhook secret configured but no signature provided')
      return NextResponse.json(
        { error: 'Signature required' },
        { status: 401 }
      )
    }

    // Validate event structure
    if (!event.type || !event.id) {
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      )
    }

    // Process the webhook event
    await handleWebhookEvent(event)

    // Log the webhook event
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const requestInfo = extractRequestInfo(request)
        await logActivity(supabaseUrl, serviceRoleKey, {
          action: `webhook.creem.${event.type}`,
          resource_type: 'webhook',
          resource_id: event.id,
          ip_address: requestInfo.ip_address,
          user_agent: requestInfo.user_agent,
          metadata: {
            event_type: event.type,
            event_id: event.id,
            data: event.data
          }
        })
      }
    } catch (logError) {
      // Don't fail the request if logging fails
      console.warn('⚠️ Failed to log webhook activity (non-critical):', logError)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    })
  } catch (error: any) {
    console.error('Webhook processing error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process webhook',
      },
      { status: 500 }
    )
  }
}

// Allow GET for webhook verification (if Creem requires it)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Creem webhook endpoint is active',
    timestamp: new Date().toISOString(),
  })
}
