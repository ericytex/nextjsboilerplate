# First-Time Setup Guide

## Overview

This application uses a **database-first setup flow** that runs automatically when you start the application for the first time. All data is persisted in Supabase - no in-memory storage is used.

## Setup Flow

### Step 1: Start the Application

```bash
npm run dev
```

When you visit the application for the first time, you'll be automatically redirected to `/setup` if the database is not configured.

### Step 2: Database Configuration

1. **Enter Supabase Credentials:**

   **Using the New Supabase UI (Recommended):**
   - Open your Supabase project
   - Click the **"Connect"** button at the top of the dashboard
   - In the modal, select the **"App Frameworks"** tab
   - Choose:
     - Framework: **Next.js**
     - Using: **App Router**
     - With: **supabase-js**
   - Copy the values from the `.env.local` snippet:
     - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL` (format: `https://[project-ref].supabase.co`)
     - **Publishable Key**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (starts with `sb_publishable_...`)
     - **Service Role Key** (Optional): Look for `service_role` key in the same modal or Settings → API

   **Using the Old Supabase UI:**
   - **Project URL**: Settings → API → Project URL
   - **Anon/Public Key**: Settings → API → anon/public key
   - **Service Role Key** (Optional): Settings → API → service_role key
   - **Database URL** (Optional): Settings → Database → Connection string

2. **Test Connection:**
   - Click "Test Connection" to verify your credentials
   - You should see: ✅ "Connection successful!"

3. **Create Database Tables:**
   - If tables don't exist, you'll see SQL to run
   - Copy the SQL provided
   - Go to Supabase Dashboard → SQL Editor → New Query
   - Paste and run the SQL
   - Return to setup page and click "Continue"

4. **Save Configuration:**
   - Click "Continue" to save database configuration
   - Configuration is saved to `integration_configs` table in Supabase

### Step 3: Create Admin User

1. **Enter Admin Details:**
   - **Full Name**: Your name
   - **Email**: Admin email address
   - **Password**: Minimum 8 characters
   - **Confirm Password**: Re-enter password

2. **Create Account:**
   - Click "Create Admin Account"
   - Admin user is created with `role: 'admin'`
   - User settings and activity log are automatically created

3. **Setup Complete:**
   - You'll see "Setup Complete!" message
   - Automatically redirected to dashboard after 2 seconds

## Database Schema

The setup creates the following tables:

- **integration_configs** - Stores all integration configurations
- **users** - User accounts with roles (admin, user, moderator)
- **user_settings** - User preferences and settings
- **user_sessions** - Active user sessions
- **videos** - Video content
- **subscriptions** - User subscription plans
- **payments** - Payment transactions
- **api_keys** - User-generated API keys
- **activity_logs** - System activity tracking

All tables include:
- Row Level Security (RLS) enabled
- Proper indexes for performance
- Timestamps (created_at, updated_at)

## Subsequent Runs

After initial setup:

1. **Automatic Check:**
   - Application checks if setup is complete on startup
   - If admin user exists, setup is skipped
   - You go directly to the application

2. **No Setup Required:**
   - All configurations are persisted in Supabase
   - No need to reconfigure
   - Data survives server restarts

## Environment Variables

After setup, add these to your `.env.local` (or Vercel environment variables):

```env
# New Supabase UI (recommended)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...

# Service Role Key (optional, for admin operations)
SUPABASE_SERVICE_ROLE_KEY=sb_service_...

# Old Supabase UI (still supported)
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** The application supports both the new key name (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`) and the old key name (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) for backward compatibility.

**Note:** The setup flow saves these to the database, but environment variables are still recommended for optimal performance.

## Troubleshooting

### "Database tables not found"

**Solution:**
1. Copy the SQL provided in the error message
2. Go to Supabase Dashboard → SQL Editor
3. Click "New Query"
4. Paste the SQL
5. Click "Run" (or Cmd/Ctrl + Enter)
6. Return to setup and click "Continue" again

### "Admin user already exists"

**Cause:** Setup was already completed.

**Solution:** 
- You can access the application normally
- If you need to create another admin, do it through the dashboard (after implementing admin management)

### "Connection test failed"

**Check:**
1. Project URL is correct (includes `https://`)
2. Anon key is correct (starts with `eyJ...`)
3. Supabase project is active (not paused)
4. Network connection is working

### Setup page keeps showing

**Check:**
1. Database tables were created successfully
2. Admin user exists in `users` table with `role = 'admin'`
3. Environment variables are set correctly

## Security Notes

- ⚠️ **Never expose Service Role Key** in client-side code
- ✅ Use Anon Key for client-side operations
- ✅ Use Service Role Key only in API routes
- ✅ Passwords are hashed with bcrypt (10 rounds)
- ✅ Enable RLS policies for production
- ✅ Rotate keys regularly

## Next Steps

After setup:

1. ✅ Database is configured and persisted
2. ✅ Admin user created
3. ✅ All tables created
4. ✅ Ready to use the application
5. ✅ Configure additional integrations in Settings → Integrations
6. ✅ All future data persists to Supabase

## Manual Setup (Advanced)

If you prefer to set up manually:

1. Create Supabase project
2. Run the SQL schema (from `getDatabaseSchema()` function)
3. Add environment variables
4. Create admin user via SQL or API
5. Application will detect setup is complete

## Support

For issues:
1. Check Supabase dashboard for errors
2. Review application logs
3. Verify database tables exist
4. Check environment variables

