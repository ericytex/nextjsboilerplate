# Payment Redirect URLs

## Where the Redirect URLs Are

The redirect URLs are returned by the API checkout routes:

- `/api/checkout/free`
- `/api/checkout/basic`
- `/api/checkout/pro`
- `/api/checkout/business`

## API Response Format

Each API route returns a JSON object with:

```json
{
  "url": "https://creem.io/checkout/test-link-{plan}",
  "success_url": "https://your-domain.vercel.app/success?plan={plan}",
  "cancel_url": "https://your-domain.vercel.app/cancel"
}
```

## Example API Responses

### Free Plan
```json
{
  "url": "https://creem.io/checkout/test-link-free",
  "success_url": "https://your-domain.vercel.app/success?plan=free",
  "cancel_url": "https://your-domain.vercel.app/cancel"
}
```

### Basic Plan
```json
{
  "url": "https://creem.io/checkout/test-link-basic",
  "success_url": "https://your-domain.vercel.app/success?plan=basic",
  "cancel_url": "https://your-domain.vercel.app/cancel"
}
```

## How to Use with Creem.io

When integrating with Creem.io, you'll need to:

1. **Fetch the checkout data** from the API route
2. **Pass the redirect URLs** to Creem.io when creating the checkout session:
   - Use `success_url` for successful payments
   - Use `cancel_url` for canceled payments
3. **Include the plan ID** in the success URL query parameter

## Testing Locally

When testing locally, the URLs will be:
- Success: `http://localhost:3000/success?plan={plan}`
- Cancel: `http://localhost:3000/cancel`

## Production URLs

After deploying to Vercel, the URLs will automatically use your production domain:
- Success: `https://your-project.vercel.app/success?plan={plan}`
- Cancel: `https://your-project.vercel.app/cancel`

## Pages

- **Success Page**: `/success?plan={plan-id}` - Shows payment confirmation
- **Cancel Page**: `/cancel` - Shows payment cancellation message

