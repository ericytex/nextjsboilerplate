import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`

  return NextResponse.json({
    url: process.env.CREEM_CHECKOUT_BUSINESS || 'https://creem.io/checkout/test-link-business',
    success_url: `${baseUrl}/success?plan=business`,
    cancel_url: `${baseUrl}/cancel`,
  })
}

