# Free Plan Setup - Business Pays for Users

## How It Works

The **Free Plan** allows users to sign up without paying. Instead, **you (the business) are charged** by Creem.io for each free user signup.

## Current Implementation

1. **User clicks "Get Started" on Free Plan**
   - Skips Creem.io checkout entirely
   - Goes directly to `/success?plan=free`

2. **Success Page**
   - Shows "Welcome!" instead of "Payment Successful"
   - Displays message: "Your free plan is active. We're covering the cost for you!"
   - Automatically tracks the signup via `/api/track-free-signup`

3. **Tracking Endpoint** (`/api/track-free-signup`)
   - Logs the free signup
   - Currently just console logs (you need to add your billing logic)

## What You Need to Do

### Option 1: Integrate with Creem.io API

Update `/app/api/track-free-signup/route.ts` to call Creem.io's API to charge your account:

```typescript
// Example (adjust to Creem.io's actual API)
await fetch('https://creem.io/api/charge-business', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.CREEM_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    plan: 'free',
    amount: 0, // or whatever you're charged per free user
    user_id: userId,
  }),
})
```

### Option 2: Store in Database

Store free signups in your database and process charges in batch:

```typescript
// Store in database
await db.freeSignups.create({
  plan: 'free',
  timestamp: new Date(),
  // ... other user data
})
```

### Option 3: Webhook to Your Backend

Send a webhook to your backend service that handles billing:

```typescript
await fetch(process.env.BILLING_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({ plan: 'free', ... }),
})
```

## Environment Variables

Add to your `.env.local` and Vercel:

```env
CREEM_API_KEY=your-creem-api-key
BILLING_WEBHOOK_URL=https://your-billing-service.com/webhook
```

## Pricing Page Display

The Free plan now shows:
- Price: "$0"
- Note: "Free for you, we cover the cost"

## Success Page

For free plans:
- Title: "Welcome!" (instead of "Payment Successful")
- Message: "Your free plan is active. We're covering the cost for you!"

## Important Notes

- Free plan users **never see Creem.io checkout**
- Free plan users **never pay anything**
- **You are charged** for each free signup (via Creem.io)
- The tracking endpoint logs each signup for billing purposes

