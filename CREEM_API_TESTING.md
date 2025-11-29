# Creem.io API Testing Guide

## Prerequisites

1. **Set up environment variables** in `.env.local`:
```bash
CREEM_API_KEY=your_creem_api_key_here
CREEM_WEBHOOK_SECRET=your_webhook_secret_here  # Optional
CREEM_TEST_MODE=true  # Set to false for production
```

2. **Get your Creem API Key**:
   - Go to [Creem Dashboard](https://creem.io/dashboard/developers)
   - Navigate to Developers section
   - Copy your API key
   - Enable Test Mode in the dashboard for testing

## Testing Methods

### Method 1: Using the Test Page (Recommended)

Navigate to `/dashboard/test/creem` in your browser to use the interactive test interface.

### Method 2: Using cURL

#### 1. Test Product Creation
```bash
curl -X POST http://localhost:3000/api/creem/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product for API testing",
    "price": 2999,
    "currency": "USD",
    "billing_type": "onetime"
  }'
```

**Note:** Price is in cents (2999 = $29.99). For recurring products:
```bash
curl -X POST http://localhost:3000/api/creem/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Subscription",
    "description": "Monthly subscription product",
    "price": 2999,
    "currency": "USD",
    "billing_type": "recurring",
    "billing_period": "every-month",
    "tax_mode": "inclusive",
    "tax_category": ["saas"]
  }'
```

#### 2. List Products
```bash
curl http://localhost:3000/api/creem/products
```

#### 3. Get Single Product
```bash
curl "http://localhost:3000/api/creem/products?productId=YOUR_PRODUCT_ID"
```

#### 4. Create Checkout Session
```bash
curl -X POST http://localhost:3000/api/creem/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "YOUR_PRODUCT_ID",
    "customerEmail": "test@example.com",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }'
```

#### 5. Get Checkout Session
```bash
curl "http://localhost:3000/api/creem/checkout?checkoutId=YOUR_CHECKOUT_ID"
```

#### 6. Create Discount Code
```bash
curl -X POST http://localhost:3000/api/creem/discounts \
  -H "Content-Type: application/json" \
  -d '{
    "code": "TEST10",
    "type": "percentage",
    "value": 10,
    "description": "10% off test discount"
  }'
```

#### 7. Validate License Key
```bash
curl -X POST "http://localhost:3000/api/creem/licenses?action=validate" \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "YOUR_LICENSE_KEY"
  }'
```

#### 8. Get Subscription
```bash
curl "http://localhost:3000/api/creem/subscriptions?subscriptionId=YOUR_SUBSCRIPTION_ID"
```

#### 9. Cancel Subscription
```bash
curl -X POST "http://localhost:3000/api/creem/subscriptions?action=cancel" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "YOUR_SUBSCRIPTION_ID",
    "cancelImmediately": false,
    "reason": "Testing cancellation"
  }'
```

### Method 3: Using Postman or Thunder Client

1. Import the following collection structure:
   - Base URL: `http://localhost:3000/api/creem`
   - Headers: `Content-Type: application/json`

2. Test each endpoint with the JSON payloads shown above.

## Testing Checklist

- [ ] Environment variables set correctly
- [ ] Test Mode enabled in Creem dashboard
- [ ] Product creation works
- [ ] Product listing works
- [ ] Checkout session creation works
- [ ] Checkout session retrieval works
- [ ] Discount code creation works
- [ ] License validation works
- [ ] Subscription operations work
- [ ] Webhook endpoint is accessible

## Webhook Testing

### Using ngrok for Local Testing

1. Install ngrok: `npm install -g ngrok` or download from [ngrok.com](https://ngrok.com)

2. Start your Next.js server:
```bash
npm run dev
```

3. In another terminal, start ngrok:
```bash
ngrok http 3000
```

4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

5. In Creem Dashboard → Developers → Webhooks, add:
```
https://abc123.ngrok.io/api/webhooks/creem
```

6. Test webhook by triggering events in Creem dashboard or making test purchases.

### Verify Webhook Endpoint

```bash
curl http://localhost:3000/api/webhooks/creem
```

Should return:
```json
{
  "message": "Creem webhook endpoint is active",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Common Issues

### Error: "CREEM_API_KEY environment variable is not set"
- Make sure `.env.local` exists in the project root
- Restart your Next.js dev server after adding environment variables
- Verify the variable name is exactly `CREEM_API_KEY`

### Error: "401 Unauthorized" or "403 Forbidden"
- Check that your API key is correct
- Verify you're using the test API key when `CREEM_TEST_MODE=true`
- Make sure Test Mode is enabled in Creem dashboard

### Error: "Network request failed"
- Check that your Next.js server is running
- Verify the API endpoint URLs are correct
- Check network connectivity

## Next Steps

1. Test all endpoints with real data
2. Implement business logic in webhook handlers
3. Add error handling and logging
4. Set up production environment variables
5. Configure webhook signature verification

