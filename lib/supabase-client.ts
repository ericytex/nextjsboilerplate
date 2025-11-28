import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client with custom credentials
 * Used when saving Supabase config itself (chicken-and-egg problem)
 */
export function createSupabaseClient(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Check if we have Supabase credentials stored (from form or env)
 */
export function getSupabaseCredentials(): { url: string; key: string } | null {
  // First try environment variables
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey }
  }

  return null
}

