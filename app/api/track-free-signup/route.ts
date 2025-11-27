import { NextResponse } from 'next/server'

/**
 * This endpoint tracks free plan signups.
 * When a user signs up for the free plan, you (the business) will be charged by Creem.io.
 * 
 * You can:
 * 1. Log this to a database
 * 2. Send to an analytics service
 * 3. Trigger a webhook to Creem.io to charge your account
 * 4. Send yourself an email notification
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { plan, timestamp } = body

    // Log the free signup (you can replace this with database storage, webhook, etc.)
    console.log('Free plan signup tracked:', {
      plan,
      timestamp,
      date: new Date().toISOString(),
      note: 'Business should be charged for this free user signup',
    })

    // TODO: Add your logic here to:
    // - Store in database
    // - Send webhook to Creem.io to charge your account
    // - Send notification email
    // - Update analytics

    return NextResponse.json({
      success: true,
      message: 'Free signup tracked',
      note: 'This signup should be charged to the business account',
    })
  } catch (error) {
    console.error('Error tracking free signup:', error)
    return NextResponse.json(
      { error: 'Failed to track signup' },
      { status: 500 }
    )
  }
}

