#!/bin/bash

# ============================================
# Database Reset Script
# This script helps you reset your Supabase database
# ============================================

set -e

echo "⚠️  WARNING: This will DELETE ALL TABLES and DATA in your database!"
echo ""
echo "This script will:"
echo "  - Delete all tables"
echo "  - Delete all users"
echo "  - Delete all data"
echo "  - Reset your database to a clean state"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Reset cancelled."
    exit 0
fi

echo ""
echo "📋 To reset your database:"
echo ""
echo "1. Go to your Supabase Dashboard: https://app.supabase.com"
echo "2. Select your project"
echo "3. Go to SQL Editor (left sidebar)"
echo "4. Click 'New Query'"
echo "5. Copy and paste the contents of: scripts/reset-database.sql"
echo "6. Click 'Run' (or press Cmd/Ctrl + Enter)"
echo "7. Verify tables are deleted (check Table Editor)"
echo ""
echo "Alternatively, you can run the SQL directly:"
echo ""
echo "  cat scripts/reset-database.sql"
echo ""
echo "After resetting, you can test the setup flow again by:"
echo "  1. Restarting your dev server: npm run dev"
echo "  2. Visiting http://localhost:3000"
echo "  3. You should be redirected to /setup"
echo ""

