# Checkout Setup Guide

## Current Issue

The checkout URLs are currently placeholders that return 404 errors:
- `https://creem.io/checkout/test-link-free`
- `https://creem.io/checkout/test-link-basic`
- `https://creem.io/checkout/test-link-pro`
- `https://creem.io/checkout/test-link-business`

## How to Fix

### Option 1: Replace with Real Creem.io Checkout Links

Update the API routes in `/app/api/checkout/{plan}/route.ts` with your actual Creem.io checkout URLs:

**Example for `/app/api/checkout/basic/route.ts`:**
```typescript
return NextResponse.json({
  url: 'https://creem.io/checkout/YOUR-ACTUAL-CHECKOUT-LINK-BASIC',
  success_url: `${baseUrl}/success?plan=basic`,
  cancel_url: `${baseUrl}/cancel`,
})
```

### Option 2: Use Environment Variables (Recommended)

1. Create a `.env.local` file:
```env
CREEM_CHECKOUT_FREE=https://creem.io/checkout/your-free-link
CREEM_CHECKOUT_BASIC=https://creem.io/checkout/your-basic-link
CREEM_CHECKOUT_PRO=https://creem.io/checkout/your-pro-link
CREEM_CHECKOUT_BUSINESS=https://creem.io/checkout/your-business-link
```

2. Update the API routes to use environment variables:
```typescript
return NextResponse.json({
  url: process.env.CREEM_CHECKOUT_BASIC || 'https://creem.io/checkout/test-link-basic',
  success_url: `${baseUrl}/success?plan=basic`,
  cancel_url: `${baseUrl}/cancel`,
})
```

### Option 3: Integrate with Creem.io API

If Creem.io provides an API to create checkout sessions dynamically, you can:

1. Make a POST request to Creem.io API with:
   - Plan details
   - `success_url` (from our API response)
   - `cancel_url` (from our API response)

2. Get the checkout URL from Creem.io response

3. Return that URL in your API route

## Current Behavior

- **Free Plan**: Goes directly to `/success?plan=free` (no checkout needed)
- **Paid Plans**: Will show an alert if placeholder URLs are detected
- **Enterprise**: Goes to `/contact` page

## Testing

To test the success/cancel pages without real checkout:
- Success: `http://localhost:3000/success?plan=basic`
- Cancel: `http://localhost:3000/cancel`

