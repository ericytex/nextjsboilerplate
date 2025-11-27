# Setting Up Environment Variables in Vercel

## Step-by-Step Guide

### 1. Get Your Creem.io Checkout URLs

First, you need to get your actual checkout URLs from your Creem.io dashboard:
- Go to your Creem.io dashboard
- Find/create checkout links for each plan:
  - Free plan checkout URL
  - Basic plan checkout URL ($20)
  - Pro plan checkout URL ($40)
  - Business plan checkout URL ($100)

### 2. Add Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Navigate to your project: `nextjsboilerplate`

2. **Open Project Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Each Variable**

   Add these environment variables (one at a time):

   **Variable 1:**
   - **Key**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://nextjsboilerplate-bice.vercel.app`
   - **Environment**: Select all (Production, Preview, Development)

   **Variable 2:**
   - **Key**: `CREEM_CHECKOUT_FREE`
   - **Value**: `https://creem.io/checkout/your-actual-free-link`
   - **Environment**: Select all

   **Variable 3:**
   - **Key**: `CREEM_CHECKOUT_BASIC`
   - **Value**: `https://creem.io/checkout/your-actual-basic-link`
   - **Environment**: Select all

   **Variable 4:**
   - **Key**: `CREEM_CHECKOUT_PRO`
   - **Value**: `https://creem.io/checkout/your-actual-pro-link`
   - **Environment**: Select all

   **Variable 5:**
   - **Key**: `CREEM_CHECKOUT_BUSINESS`
   - **Value**: `https://creem.io/checkout/your-actual-business-link`
   - **Environment**: Select all

4. **Save and Redeploy**
   - After adding all variables, click **Save**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy** to apply the new environment variables

## Quick Copy-Paste List

When you have your Creem.io URLs, add these in Vercel:

```
NEXT_PUBLIC_APP_URL=https://nextjsboilerplate-bice.vercel.app

CREEM_CHECKOUT_FREE=https://creem.io/checkout/your-free-link
CREEM_CHECKOUT_BASIC=https://creem.io/checkout/your-basic-link
CREEM_CHECKOUT_PRO=https://creem.io/checkout/your-pro-link
CREEM_CHECKOUT_BUSINESS=https://creem.io/checkout/your-business-link
```

## Important Notes

- **Replace the placeholder URLs** with your actual Creem.io checkout links
- **Select all environments** (Production, Preview, Development) when adding variables
- **Redeploy** after adding variables for them to take effect
- The Free plan doesn't need a checkout URL (it skips checkout), but you can still add it if needed

## After Setup

Once you've added the environment variables and redeployed:
- The alert will no longer appear
- Clicking on Basic, Pro, or Business plans will redirect to your actual Creem.io checkout
- The checkout will use the correct success/cancel URLs automatically

