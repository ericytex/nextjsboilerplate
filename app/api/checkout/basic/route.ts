import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { logActivity, extractRequestInfo } from '@/lib/activity-logger'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  
  // Use Vercel URL if available, otherwise construct from host
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || (process.env.NODE_ENV === 'production' ? `https://${host}` : `http://${host}`)

  const checkoutUrl = process.env.CREEM_CHECKOUT_BASIC

  // Validate that checkout URL is set and not a placeholder
  if (!checkoutUrl || 
      checkoutUrl.includes('test-link') || 
      checkoutUrl.includes('placeholder') ||
      checkoutUrl.includes('your-actual') ||
      checkoutUrl.includes('your-')) {
    return NextResponse.json(
      { 
        error: 'Checkout URL not configured. Please set CREEM_CHECKOUT_BASIC environment variable in Vercel.',
        url: null 
      },
      { status: 500 }
    )
  }

  // Log checkout initiation
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceRoleKey) {
      const requestInfo = extractRequestInfo(request)
      await logActivity(supabaseUrl, serviceRoleKey, {
        action: 'checkout.initiated',
        resource_type: 'subscription',
        resource_id: 'basic',
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
        metadata: {
          plan: 'basic',
          trial_enabled: true,
          trial_days: 14
        }
      })
    }
  } catch (logError) {
    // Don't fail the request if logging fails
    console.warn('⚠️ Failed to log checkout activity (non-critical):', logError)
  }

  // Add trial information to the response
  return NextResponse.json({
    url: checkoutUrl,
    success_url: `${baseUrl}/success?plan=basic&trial=true`,
    cancel_url: `${baseUrl}/cancel`,
    trial_days: 14,
    message: '14-day free trial - You will not be charged for 14 days'
  })
}

