import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  
  // Use Vercel URL if available, otherwise construct from host
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || (process.env.NODE_ENV === 'production' ? `https://${host}` : `http://${host}`)

  const checkoutUrl = process.env.CREEM_CHECKOUT_PRO

  // Validate that checkout URL is set and not a placeholder
  if (!checkoutUrl || 
      checkoutUrl.includes('test-link') || 
      checkoutUrl.includes('placeholder') ||
      checkoutUrl.includes('your-actual') ||
      checkoutUrl.includes('your-')) {
    return NextResponse.json(
      { 
        error: 'Checkout URL not configured. Please set CREEM_CHECKOUT_PRO environment variable in Vercel.',
        url: null 
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    url: checkoutUrl,
    success_url: `${baseUrl}/success?plan=pro`,
    cancel_url: `${baseUrl}/cancel`,
  })
}

