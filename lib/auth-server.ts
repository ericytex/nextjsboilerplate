/**
 * Server-side authentication utilities
 * For use in Server Components and Server Actions
 */

import { cookies } from 'next/headers'
import { createSupabaseClient } from './supabase-client'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  role: string
}

/**
 * Get authenticated user from server-side (cookies)
 * Returns null if not authenticated
 */
export async function getServerAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    if (!userId) {
      return null
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return null
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .maybeSingle()

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    }
  } catch (error) {
    console.error('Error getting server auth user:', error)
    return null
  }
}

/**
 * Require authentication in Server Components
 * Redirects to signin if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getServerAuthUser()
  
  if (!user) {
    redirect('/signin?redirect=' + encodeURIComponent('/dashboard'))
  }

  return user
}



