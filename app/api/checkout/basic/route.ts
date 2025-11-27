import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  const headersList = headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const baseUrl = `${protocol}://${host}`

  return NextResponse.json({
    url: 'https://creem.io/checkout/test-link-basic',
    success_url: `${baseUrl}/success?plan=basic`,
    cancel_url: `${baseUrl}/cancel`,
  })
}

