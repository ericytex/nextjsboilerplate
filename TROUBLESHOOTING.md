# Troubleshooting Setup Issues

## Common Issues and Solutions

### Issue: "It's not working" - Setup page not showing

**Symptoms:**
- Visiting the app doesn't redirect to `/setup`
- Setup page shows errors
- Can't complete setup

**Solutions:**

1. **Check if you're being redirected:**
   - Visit `http://localhost:3000/setup` directly
   - If it works, the middleware might not be redirecting properly

2. **Check environment variables:**
   - If `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, the middleware thinks setup is done
   - Either remove it or ensure the database is actually configured
   - The setup flow saves config to database, not just env vars

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear cache and cookies

4. **Check console errors:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed API calls

### Issue: "Database connection test fails"

**Check:**
1. Project URL format: `https://[project-ref].supabase.co` (must include `https://`)
2. Anon key is correct (starts with `eyJ...`)
3. Supabase project is active (not paused)
4. Network connection is working
5. No firewall blocking Supabase

**Solution:**
- Double-check credentials from Supabase Dashboard
- Try copying credentials again
- Verify project is not paused in Supabase

### Issue: "Database tables not found"

**Solution:**
1. Copy the SQL provided in the error message
2. Go to Supabase Dashboard → SQL Editor
3. Click "New Query"
4. Paste the SQL
5. Click "Run" (or Cmd/Ctrl + Enter)
6. Verify tables were created (check Table Editor)
7. Return to setup and click "Continue" again

### Issue: "Admin user creation fails"

**Check:**
1. Database tables exist (especially `users` table)
2. Email is valid format
3. Password is at least 8 characters
4. No user with that email already exists

**Solution:**
- Check Supabase Table Editor for `users` table
- Try a different email
- Check browser console for specific error messages

### Issue: Setup page keeps showing after completion

**Check:**
1. Admin user exists in `users` table with `role = 'admin'`
2. Environment variables are set correctly
3. Database connection is working

**Solution:**
1. Go to Supabase Table Editor
2. Check `users` table
3. Verify there's a user with `role = 'admin'`
4. If not, create one manually or re-run setup

### Issue: Middleware not redirecting

**Check:**
1. `middleware.ts` file exists in root
2. No build errors
3. Next.js version supports middleware

**Solution:**
- Restart dev server: `npm run dev`
- Check terminal for middleware errors
- Verify middleware.ts is in project root

### Issue: API routes returning errors

**Check:**
1. API routes exist in `app/api/setup/`
2. No TypeScript errors
3. Dependencies installed (`bcryptjs`, `@supabase/supabase-js`)

**Solution:**
```bash
npm install
npm run build  # Check for errors
```

### Issue: "Cannot find module" errors

**Solution:**
```bash
npm install
# Or specific packages:
npm install bcryptjs @types/bcryptjs @supabase/supabase-js
```

### Debug Steps

1. **Check setup status API:**
   ```bash
   curl http://localhost:3000/api/setup/status
   ```
   Should return JSON with `setupComplete: false` on first run

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **Check server logs:**
   - Terminal running `npm run dev`
   - Look for error messages
   - Check for database connection errors

4. **Verify Supabase:**
   - Go to Supabase Dashboard
   - Check project is active
   - Verify API keys are correct
   - Check Table Editor for tables

5. **Manual setup check:**
   - Visit `/setup` directly
   - Check if page loads
   - Try each step manually
   - Check error messages

### Getting Help

If issues persist:

1. **Check logs:**
   - Browser console errors
   - Server terminal output
   - Supabase dashboard logs

2. **Verify setup:**
   - Supabase project is created
   - API keys are correct
   - Network connection works

3. **Reset setup:**
   - Delete `.env.local` (if you want to start fresh)
   - Clear Supabase tables (if needed)
   - Restart dev server

4. **Common fixes:**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   
   # Reinstall dependencies
   rm -rf node_modules
   npm install
   
   # Restart dev server
   npm run dev
   ```

