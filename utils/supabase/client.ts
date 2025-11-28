'use client'

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

/**
 * Client-side Supabase client for Client Components
 * Uses Supabase SSR package for proper cookie handling
 * 
 * Usage in Client Components:
 * ```tsx
 * 'use client'
 * import { createClient } from '@/utils/supabase/client'
 * 
 * const supabase = createClient()
 * const { data } = await supabase.from('users').select('*')
 * ```
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}

