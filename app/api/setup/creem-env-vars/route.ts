import { NextResponse } from 'next/server'

/**
 * Get Creem.io environment variables (for pre-filling setup form)
 * GET /api/setup/creem-env-vars
 * 
 * Note: Only returns variables that are safe to expose to client
 * API Key should NOT be exposed - we'll check if it exists but not return it
 */
export async function GET() {
  try {
    // Check if API key exists (but don't return it for security)
    const hasApiKey = !!process.env.CREEM_API_KEY
    const hasWebhookSecret = !!process.env.CREEM_WEBHOOK_SECRET
    const testMode = process.env.CREEM_TEST_MODE === 'true' || process.env.NODE_ENV !== 'production'

    return NextResponse.json({
      hasEnvVars: hasApiKey,
      hasApiKey: hasApiKey,
      hasWebhookSecret: hasWebhookSecret,
      testMode: testMode,
      // Don't return API key or webhook secret for security
      // They will be used server-side automatically
    })
  } catch (error: any) {
    console.error('Error reading Creem env vars:', error)
    return NextResponse.json({
      hasEnvVars: false,
      hasApiKey: false,
      hasWebhookSecret: false,
      testMode: false,
    })
  }
}

