-- ============================================
-- Database Reset Script
-- This script will DELETE ALL TABLES and DATA
-- Use with caution! This is irreversible.
-- ============================================

-- Step 1: Disable Row Level Security on all tables
ALTER TABLE IF EXISTS activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS integration_configs DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies (if they exist)
DROP POLICY IF EXISTS "Service role can manage integration configs" ON integration_configs;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Step 3: Drop all tables in reverse order of dependencies
-- (Tables with foreign keys must be dropped first)

-- Drop tables that reference other tables
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- Drop the users table (referenced by others)
DROP TABLE IF EXISTS users CASCADE;

-- Drop integration configs (standalone)
DROP TABLE IF EXISTS integration_configs CASCADE;

-- Step 4: Drop all indexes (if any remain)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_user_settings_user_id;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_videos_user_id;
DROP INDEX IF EXISTS idx_videos_status;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_payments_user_id;
DROP INDEX IF EXISTS idx_api_keys_user_id;
DROP INDEX IF EXISTS idx_activity_logs_user_id;
DROP INDEX IF EXISTS idx_activity_logs_created_at;

-- Step 5: Verify all tables are dropped
-- Run this query to check:
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_type = 'BASE TABLE';

-- ============================================
-- Reset Complete!
-- Your database is now clean and ready for
-- a fresh setup.
-- ============================================

