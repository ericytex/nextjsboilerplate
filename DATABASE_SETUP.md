# Database Setup & Configuration Persistence

## How Configuration Storage Works

### Current Storage Methods

1. **In-Memory (Temporary)** - Used until Supabase is configured
   - ⚠️ **Not persisted** - Lost on server restart
   - Only used as fallback

2. **Supabase Database (Persistent)** - Once configured
   - ✅ **Fully persisted** - All configurations saved to database
   - Survives server restarts
   - Accessible from anywhere

## Setup Flow: Database First

### Step 1: Configure Supabase (Database)

**This must be done FIRST** so all other configurations can be persisted.

1. Go to **Dashboard → Settings → Integrations**
2. Find **Supabase** card
3. Toggle it **ON**
4. Enter your credentials:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **Anon/Public Key**: Your anon key from Supabase dashboard
5. Click **"Test Connection"** to verify
6. Click **"Save Changes"**

### Step 2: Create Database Table

When you save Supabase configuration, you'll see a message if the table doesn't exist.

**Run this SQL in Supabase SQL Editor:**

```sql
-- Integration configurations table
CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY,
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access
-- (Adjust based on your security needs)
CREATE POLICY "Service role can manage integration configs" 
ON integration_configs
FOR ALL
USING (true)
WITH CHECK (true);
```

**How to run SQL:**
1. Go to Supabase Dashboard
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Paste the SQL above
5. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Persistence

After creating the table:

1. Go back to **Integrations** page
2. Configure Supabase again (or any integration)
3. Click **"Save Changes"**
4. You should see: ✅ **"Supabase configured and saved to database!"**

### Step 4: Configure Other Integrations

Once Supabase is set up, **all other integrations** will automatically:
- ✅ Save to Supabase database
- ✅ Persist across server restarts
- ✅ Be accessible from anywhere

## Storage Location

### Before Supabase Setup
- **Location**: Server memory (temporary)
- **Persistence**: ❌ Lost on restart
- **Message**: "⚠️ Configuration saved temporarily"

### After Supabase Setup
- **Location**: Supabase PostgreSQL database
- **Persistence**: ✅ Permanent
- **Message**: "✅ Configuration saved to Supabase database"

## Database Schema

### `integration_configs` Table

```sql
CREATE TABLE integration_configs (
  id TEXT PRIMARY KEY,                    -- Integration ID (e.g., 'supabase', 'stripe')
  config JSONB NOT NULL,                  -- Full configuration object
  created_at TIMESTAMP WITH TIME ZONE,   -- When first created
  updated_at TIMESTAMP WITH TIME ZONE     -- Last update time
);
```

### Example Data

```json
{
  "id": "supabase",
  "config": {
    "enabled": true,
    "customSettings": {
      "projectUrl": "https://xxx.supabase.co",
      "anonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "serviceRoleKey": "..."
    }
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

### "Database table not found"

**Solution**: Run the SQL schema above in Supabase SQL Editor.

### "Configuration saved temporarily"

**Cause**: Supabase not configured yet.

**Solution**: 
1. Configure Supabase first
2. Create the database table
3. Save Supabase config again

### Configs not persisting

**Check**:
1. Is Supabase configured? (Check integration status)
2. Does the table exist? (Check Supabase SQL Editor)
3. Are credentials correct? (Test connection)

## Best Practices

1. **Always configure Supabase first** - This ensures all configs persist
2. **Use Service Role Key** - For server-side operations (keep secret!)
3. **Enable RLS** - Row Level Security for production
4. **Backup regularly** - Supabase provides automatic backups
5. **Monitor usage** - Check Supabase dashboard for storage/usage

## Migration from In-Memory to Database

If you have configs in memory:

1. Configure Supabase
2. Create database table
3. Re-save each integration configuration
4. They'll automatically migrate to database

## Security Notes

- ⚠️ **Never expose Service Role Key** in client-side code
- ✅ Use Anon Key for client-side operations
- ✅ Use Service Role Key only in API routes
- ✅ Enable RLS policies for production
- ✅ Rotate keys regularly

## Next Steps

After database setup:
1. ✅ All configurations persist
2. ✅ Can configure other integrations
3. ✅ Data survives server restarts
4. ✅ Accessible from multiple instances
5. ✅ Can query/edit via Supabase dashboard

