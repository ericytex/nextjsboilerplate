# Database Reset and Testing Guide

## Quick Reset Steps

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Reset Script**
   - Copy the entire contents of `scripts/reset-database.sql`
   - Paste into the SQL Editor
   - Click "Run" (or press `Cmd/Ctrl + Enter`)

4. **Verify Reset**
   - Go to "Table Editor" in the left sidebar
   - Confirm all tables are deleted
   - You should see an empty list

5. **Test Setup Flow**
   - Restart your dev server: `npm run dev`
   - Visit http://localhost:3000
   - You should be redirected to `/setup`
   - Complete the setup flow again

### Option 2: Using Supabase CLI (if installed)

```bash
# If you have Supabase CLI installed
supabase db reset
```

## What Gets Deleted

The reset script will delete:
- ✅ All tables (users, videos, subscriptions, etc.)
- ✅ All data (all rows in all tables)
- ✅ All RLS policies
- ✅ All indexes
- ✅ All foreign key constraints

## After Reset

1. **Restart Dev Server**
   ```bash
   npm run dev
   ```

2. **Visit Application**
   - Go to http://localhost:3000
   - Should redirect to `/setup`

3. **Complete Setup**
   - Enter Supabase credentials
   - Create database tables
   - Create admin user

4. **Verify Everything Works**
   - Check that you can sign in
   - Check that dashboard loads
   - Check that data persists after restart

## Troubleshooting

### "Tables still exist after running script"

- Make sure you copied the ENTIRE SQL script
- Check for any errors in the SQL Editor
- Try running each DROP statement individually
- Check Table Editor to see which tables remain

### "Setup page doesn't show after reset"

- Check that environment variables are still set in `.env.local`
- If env vars exist, middleware won't redirect to setup
- Temporarily remove env vars to test setup flow:
  ```bash
  # Comment out or remove these lines in .env.local
  # NEXT_PUBLIC_SUPABASE_URL=...
  # NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
  # SUPABASE_SERVICE_ROLE_KEY=...
  ```

### "Can't connect to database after reset"

- Verify your Supabase project is active (not paused)
- Check your Project URL and API keys
- Test connection in Supabase Dashboard

## Safety Notes

⚠️ **This is a destructive operation!**

- All data will be permanently deleted
- This cannot be undone
- Make sure you have backups if needed
- Only use this for development/testing

## Quick Test Checklist

After reset, verify:

- [ ] All tables deleted (check Table Editor)
- [ ] Dev server restarts without errors
- [ ] Visiting `/` redirects to `/setup`
- [ ] Database setup step works
- [ ] Tables can be created
- [ ] Admin user can be created
- [ ] Sign in works after setup
- [ ] Dashboard loads correctly
- [ ] Data persists after server restart

