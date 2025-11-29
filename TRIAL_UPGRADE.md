# Trial Auto-Upgrade to Basic Plan

This document explains how the automatic trial-to-basic plan upgrade system works.

## Overview

When a user's trial subscription expires, the system can automatically upgrade them to the basic plan. This can be done:
- **Without payment**: Simply upgrade the subscription status in the database
- **With Creem.io integration**: Create a checkout session for the user to complete payment

## API Endpoint

### POST `/api/subscriptions/upgrade-trial`

Upgrades all expiring trial subscriptions to the basic plan.

#### Request Body (Optional)

```json
{
  "gracePeriodHours": 24,        // Default: 24 hours
  "createCreemCheckout": false,  // Default: false
  "dryRun": false                // Default: false
}
```

#### Parameters

- **gracePeriodHours** (number, optional): How many hours after expiration to still consider a trial for upgrade. Default: 24 hours.
- **createCreemCheckout** (boolean, optional): If `true`, creates a Creem.io checkout session for each upgraded user. Default: `false`.
- **dryRun** (boolean, optional): If `true`, only reports what would be upgraded without making changes. Default: `false`.

#### Response

```json
{
  "success": true,
  "message": "Upgraded 5 of 5 expiring trials",
  "upgraded": [
    {
      "subscriptionId": "uuid",
      "userId": "uuid",
      "email": "user@example.com",
      "oldPlan": "starter",
      "newPlan": "starter",
      "checkoutUrl": "https://creem.io/checkout/..." // Only if createCreemCheckout=true
    }
  ],
  "errors": [], // Any errors encountered
  "count": 5,
  "total": 5,
  "dryRun": false
}
```

### GET `/api/subscriptions/upgrade-trial`

Check for expiring trials without upgrading them.

#### Query Parameters

- **gracePeriodHours** (number, optional): Default: 24

#### Response

```json
{
  "success": true,
  "count": 3,
  "trials": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "plan": "starter",
      "status": "trialing",
      "current_period_end": "2024-01-15T00:00:00Z",
      "users": {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "John Doe"
      }
    }
  ],
  "gracePeriodHours": 24
}
```

## Usage Examples

### 1. Manual Upgrade (No Payment)

Upgrade all expiring trials without creating checkout sessions:

```bash
curl -X POST http://localhost:3000/api/subscriptions/upgrade-trial \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 2. Upgrade with Creem.io Checkout

Upgrade trials and create checkout sessions for payment:

```bash
curl -X POST http://localhost:3000/api/subscriptions/upgrade-trial \
  -H "Content-Type: application/json" \
  -d '{
    "createCreemCheckout": true
  }'
```

### 3. Dry Run (Preview)

See what would be upgraded without making changes:

```bash
curl -X POST http://localhost:3000/api/subscriptions/upgrade-trial \
  -H "Content-Type: application/json" \
  -d '{
    "dryRun": true
  }'
```

### 4. Check Expiring Trials

List all expiring trials:

```bash
curl http://localhost:3000/api/subscriptions/upgrade-trial?gracePeriodHours=48
```

## Automated Execution

### Option 1: Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/subscriptions/upgrade-trial",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs daily at midnight UTC.

### Option 2: GitHub Actions

Create `.github/workflows/trial-upgrade.yml`:

```yaml
name: Upgrade Expiring Trials

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  upgrade:
    runs-on: ubuntu-latest
    steps:
      - name: Upgrade Trials
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/subscriptions/upgrade-trial \
            -H "Content-Type: application/json" \
            -d '{"createCreemCheckout": true}'
```

### Option 3: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)

Set up a daily HTTP request to:
```
POST https://your-domain.com/api/subscriptions/upgrade-trial
Content-Type: application/json

{
  "createCreemCheckout": true
}
```

## Environment Variables

Required for Creem.io checkout integration:

```env
# Creem.io API Key
CREEM_API_KEY=your_api_key_here

# Basic Plan Product ID (from Creem.io dashboard)
CREEM_BASIC_PRODUCT_ID=prod_xxxxx

# Optional: Test mode
CREEM_TEST_MODE=false
```

## How It Works

1. **Query Expiring Trials**: Finds all subscriptions with:
   - `status = 'trialing'`
   - `current_period_end <= now`
   - `current_period_end >= (now - gracePeriodHours)`

2. **Upgrade Subscription**: For each trial:
   - Updates `plan` to `'starter'` (basic plan)
   - Updates `status` to `'active'`
   - Sets new `current_period_start` and `current_period_end` (1 month)
   - Sets `cancel_at_period_end` to `false`

3. **Optional Creem Checkout**: If `createCreemCheckout = true`:
   - Creates a checkout session via Creem.io API
   - Returns checkout URL in response
   - User can complete payment later

4. **Activity Logging**: All upgrades are logged to `activity_logs` table:
   - `subscription.trial_upgraded` - Individual upgrade
   - `subscription.trial_upgrade.batch` - Batch operation summary
   - `subscription.trial_upgrade.checkout_created` - Checkout creation (if enabled)

## Database Changes

When a trial is upgraded:

```sql
UPDATE subscriptions
SET 
  plan = 'starter',
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '1 month',
  cancel_at_period_end = false,
  updated_at = NOW()
WHERE id = 'subscription_id'
  AND status = 'trialing'
  AND current_period_end <= NOW()
```

## Best Practices

1. **Run Daily**: Set up a cron job to run once per day
2. **Grace Period**: Use 24-48 hours grace period to catch late upgrades
3. **Monitor Logs**: Check activity logs for upgrade success/failures
4. **Test First**: Always run with `dryRun: true` first
5. **Creem Integration**: Only enable `createCreemCheckout` if you have:
   - Valid `CREEM_API_KEY`
   - Valid `CREEM_BASIC_PRODUCT_ID`
   - Basic plan product created in Creem.io

## Troubleshooting

### No trials found
- Check that subscriptions have `status = 'trialing'`
- Verify `current_period_end` is in the past
- Adjust `gracePeriodHours` if needed

### Creem checkout fails
- Verify `CREEM_API_KEY` is set correctly
- Check `CREEM_BASIC_PRODUCT_ID` exists in Creem.io
- Ensure product is active in Creem.io dashboard

### Upgrade fails
- Check Supabase connection
- Verify RLS policies allow updates
- Check activity logs for detailed error messages

## Security

- Endpoint should be protected or use a secret token
- Consider adding authentication for manual triggers
- Use environment variables for sensitive data
- Log all upgrade activities for audit trail

