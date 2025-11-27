# Vercel Production URLs

## Your Vercel Deployment
**Production URL**: `https://nextjsboilerplate-bice.vercel.app`

## Redirect URLs for Payment Plans

When users complete or cancel payment, they will be redirected to:

### Success URLs (After Payment)
- **Free Plan**: `https://nextjsboilerplate-bice.vercel.app/success?plan=free`
- **Basic Plan**: `https://nextjsboilerplate-bice.vercel.app/success?plan=basic`
- **Pro Plan**: `https://nextjsboilerplate-bice.vercel.app/success?plan=pro`
- **Business Plan**: `https://nextjsboilerplate-bice.vercel.app/success?plan=business`

### Cancel URL (Payment Canceled)
- **All Plans**: `https://nextjsboilerplate-bice.vercel.app/cancel`

## API Endpoints

Test the redirect URLs by calling:
- `https://nextjsboilerplate-bice.vercel.app/api/checkout/free`
- `https://nextjsboilerplate-bice.vercel.app/api/checkout/basic`
- `https://nextjsboilerplate-bice.vercel.app/api/checkout/pro`
- `https://nextjsboilerplate-bice.vercel.app/api/checkout/business`

Each will return:
```json
{
  "url": "https://creem.io/checkout/...",
  "success_url": "https://nextjsboilerplate-bice.vercel.app/success?plan={plan}",
  "cancel_url": "https://nextjsboilerplate-bice.vercel.app/cancel"
}
```

## Setting Up Creem.io

When configuring your Creem.io checkout sessions, use these URLs:

1. **Success URL**: `https://nextjsboilerplate-bice.vercel.app/success?plan={plan-id}`
2. **Cancel URL**: `https://nextjsboilerplate-bice.vercel.app/cancel`

Replace `{plan-id}` with: `free`, `basic`, `pro`, or `business`

## Optional: Set Environment Variable in Vercel

You can optionally set `NEXT_PUBLIC_APP_URL` in Vercel's environment variables:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add: `NEXT_PUBLIC_APP_URL` = `https://nextjsboilerplate-bice.vercel.app`

This ensures the URLs are always correct even if the domain changes.

