import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    url: 'https://creem.io/checkout/test-link-free',
  })
}

