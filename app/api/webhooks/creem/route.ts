/**
 * Creem.io Webhook Handler
 * POST /api/webhooks/creem
 * Handles payment events, subscription updates, and license activations
 * Documentation: https://docs.creem.io/api-reference/webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import type { WebhookEvent, WebhookEventType } from '@/types/creem'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'

/**
 * Verify webhook signature (if Creem provides signature verification)
 * This is a placeholder - implement based on Creem's webhook signature method
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // TODO: Implement signature verification based on Creem's documentation
  // This might use HMAC-SHA256 or similar
  // For now, if webhook secret is set, we'll require it to match
  if (process.env.CREEM_WEBHOOK_SECRET) {
    return signature === process.env.CREEM_WEBHOOK_SECRET
  }
  // If no secret is configured, allow all (not recommended for production)
  return true
}

/**
 * Handle webhook events
 */
async function handleWebhookEvent(event: WebhookEvent) {
  console.log(`Processing Creem webhook event: ${event.type}`, event.data)

  switch (event.type) {
    case 'checkout.completed':
      // Handle successful checkout
      // Example: Update user subscription status, grant access, etc.
      await handleCheckoutCompleted(event.data)
      break

    case 'checkout.expired':
      // Handle expired checkout
      await handleCheckoutExpired(event.data)
      break

    case 'subscription.created':
      // Handle new subscription
      await handleSubscriptionCreated(event.data)
      break

    case 'subscription.updated':
      // Handle subscription update
      await handleSubscriptionUpdated(event.data)
      break

    case 'subscription.cancelled':
      // Handle subscription cancellation
      await handleSubscriptionCancelled(event.data)
      break

    case 'subscription.renewed':
      // Handle subscription renewal
      await handleSubscriptionRenewed(event.data)
      break

    case 'license.activated':
      // Handle license activation
      await handleLicenseActivated(event.data)
      break

    case 'license.deactivated':
      // Handle license deactivation
      await handleLicenseDeactivated(event.data)
      break

    case 'transaction.completed':
      // Handle completed transaction
      await handleTransactionCompleted(event.data)
      break

    case 'transaction.failed':
      // Handle failed transaction
      await handleTransactionFailed(event.data)
      break

    case 'refund.processed':
      // Handle refund
      await handleRefundProcessed(event.data)
      break

    default:
      console.warn(`Unknown webhook event type: ${event.type}`)
  }
}

// Event handlers (implement based on your business logic)

async function handleCheckoutCompleted(data: any) {
  // Example: Update user subscription, send confirmation email, etc.
  console.log('Checkout completed:', data)
  // TODO: Implement your business logic
}

async function handleCheckoutExpired(data: any) {
  console.log('Checkout expired:', data)
  // TODO: Implement your business logic
}

async function handleSubscriptionCreated(data: any) {
  console.log('Subscription created:', data)
  // TODO: Implement your business logic
  // Example: Create user record, grant access, send welcome email
}

async function handleSubscriptionUpdated(data: any) {
  console.log('Subscription updated:', data)
  // TODO: Implement your business logic
  // Example: Update user access level, notify user of changes
}

async function handleSubscriptionCancelled(data: any) {
  console.log('Subscription cancelled:', data)
  // TODO: Implement your business logic
  // Example: Revoke access, schedule cleanup, send cancellation email
}

async function handleSubscriptionRenewed(data: any) {
  console.log('Subscription renewed:', data)
  // TODO: Implement your business logic
  // Example: Extend access, send renewal confirmation
}

async function handleLicenseActivated(data: any) {
  console.log('License activated:', data)
  // TODO: Implement your business logic
  // Example: Grant license access, update user permissions
}

async function handleLicenseDeactivated(data: any) {
  console.log('License deactivated:', data)
  // TODO: Implement your business logic
  // Example: Revoke license access, notify user
}

async function handleTransactionCompleted(data: any) {
  console.log('Transaction completed:', data)
  // TODO: Implement your business logic
  // Example: Update payment records, send receipt
}

async function handleTransactionFailed(data: any) {
  console.log('Transaction failed:', data)
  // TODO: Implement your business logic
  // Example: Log failure, notify user, retry if applicable
}

async function handleRefundProcessed(data: any) {
  console.log('Refund processed:', data)
  // TODO: Implement your business logic
  // Example: Update records, revoke access if needed, notify user
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers (if provided)
    const signature = request.headers.get('x-creem-signature') || 
                     request.headers.get('x-signature') ||
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

