import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  
  // Use Vercel URL if available, otherwise construct from host
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || (process.env.NODE_ENV === 'production' ? `https://${host}` : `http://${host}`)

  return NextResponse.json({
    url: process.env.CREEM_CHECKOUT_BUSINESS || 'https://creem.io/checkout/test-link-business',
    success_url: `${baseUrl}/success?plan=business`,
    cancel_url: `${baseUrl}/cancel`,
  })
}

