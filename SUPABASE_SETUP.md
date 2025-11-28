# Supabase Integration Guide

## What is Supabase?

Supabase is an open-source Firebase alternative that provides:
- **PostgreSQL Database** - Full-featured relational database
- **Authentication** - User management with email, OAuth, magic links
- **Real-time Subscriptions** - Live data updates via WebSockets
- **Storage** - File uploads and management
- **Edge Functions** - Serverless functions
- **Auto-generated APIs** - REST and GraphQL APIs from your database schema

## What This Template Provides

When you configure Supabase in the integrations settings, you get:

1. **Database Storage** - Save integration configurations, user data, and app data
2. **User Management** - Authentication system ready to use
3. **API Routes** - Example endpoints showing Supabase usage
4. **Real-time Features** - Live updates for dashboards and notifications
5. **File Storage** - Upload avatars, documents, and media files

## Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Your project name
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Wait 2-3 minutes for project setup

### Step 2: Get Your Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

### Step 3: Configure in Dashboard

1. Go to **Dashboard** → **Settings** → **Integrations**
2. Find **Supabase** card
3. Toggle it **ON**
4. Fill in:
   - **Project URL**: Your Supabase project URL
   - **Anon/Public Key**: Your anon key
   - **Service Role Key**: Your service role key (optional, for admin operations)
   - **Database URL**: Found in Settings → Database → Connection string
5. Click **Save Changes**
6. Click **Test Connection** to verify

### Step 4: Add Environment Variables

Add to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For Vercel deployment, add these in **Settings** → **Environment Variables**.

### Step 5: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 6: Create Database Tables

Run this SQL in Supabase SQL Editor (Settings → SQL Editor):

```sql
-- Integration configurations table
CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (example)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table (for user settings)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your needs)
-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

## What You Can Do With Supabase

### 1. Store Integration Configurations

The template automatically saves integration settings to Supabase when configured:

```typescript
// Automatically saved when you configure integrations in the dashboard
POST /api/supabase/integrations
```

### 2. User Authentication

Use Supabase Auth for login/signup:

```typescript
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

### 3. Database Queries

Query your database from API routes:

```typescript
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

// Get all users
const { data, error } = await supabase
  .from('users')
  .select('*')

// Insert data
const { data, error } = await supabase
  .from('users')
  .insert({ email: 'new@example.com', name: 'New User' })
```

### 4. Real-time Subscriptions

Listen for database changes:

```typescript
const supabase = createBrowserClient()

// Subscribe to changes
const channel = supabase
  .channel('users')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'users' },
    (payload) => {
      console.log('New user:', payload.new)
    }
  )
  .subscribe()
```

### 5. File Storage

Upload files to Supabase Storage:

```typescript
const supabase = createBrowserClient()

// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('user-123.jpg', file)

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('user-123.jpg')
```

## Example API Routes

The template includes example routes:

- `GET /api/supabase/test` - Test connection
- `GET /api/supabase/integrations` - Get saved integrations
- `POST /api/supabase/integrations` - Save integration config
- `GET /api/supabase/users` - Get users
- `POST /api/supabase/users` - Create user

## Security Best Practices

1. **Never expose service_role key** - Only use in server-side code
2. **Use RLS (Row Level Security)** - Protect your data with policies
3. **Validate inputs** - Always validate user input before database operations
4. **Use environment variables** - Never hardcode credentials
5. **Enable RLS on all tables** - Default deny, then allow specific operations

## Next Steps

1. ✅ Configure Supabase in dashboard
2. ✅ Install `@supabase/supabase-js`
3. ✅ Create database tables
4. ✅ Test connection
5. ✅ Start using Supabase in your API routes
6. ✅ Set up authentication
7. ✅ Configure storage buckets
8. ✅ Enable real-time features

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

