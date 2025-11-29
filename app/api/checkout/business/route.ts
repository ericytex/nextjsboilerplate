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

  const checkoutUrl = process.env.CREEM_CHECKOUT_BUSINESS

  // Validate that checkout URL is set and not a placeholder
  if (!checkoutUrl || 
      checkoutUrl.includes('test-link') || 
      checkoutUrl.includes('placeholder') ||
      checkoutUrl.includes('your-actual') ||
      checkoutUrl.includes('your-')) {
    return NextResponse.json(
      { 
        error: 'Checkout URL not configured. Please set CREEM_CHECKOUT_BUSINESS environment variable in Vercel.',
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
        resource_id: 'business',
        ip_address: requestInfo.ip_address,
        user_agent: requestInfo.user_agent,
        metadata: {
          plan: 'business'
        }
      })
    }
  } catch (logError) {
    console.warn('⚠️ Failed to log checkout activity (non-critical):', logError)
  }

  return NextResponse.json({
    url: checkoutUrl,
    success_url: `${baseUrl}/success?plan=business`,
    cancel_url: `${baseUrl}/cancel`,
  })
}

