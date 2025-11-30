/**
 * Authentication utilities
 * Handles user session verification for API routes and middleware
 */

import { NextRequest } from 'next/server'
import { createSupabaseClient } from './supabase-client'

export interface AuthResult {
  authenticated: boolean
  userId?: string
  user?: {
    id: string
    email: string
    fullName: string | null
    role: string
  }
  error?: string
}

/**
 * Verify user authentication from request
 * Checks for userId in cookies, Authorization header, or session token
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        authenticated: false,
        error: 'Database not configured'
      }
    }

    let userId: string | null = null

    // First, try to get userId from cookie (most secure for middleware)
    const userIdCookie = request.cookies.get('user_id')
    if (userIdCookie) {
      userId = userIdCookie.value
    }

    // Try to get userId from Authorization header (Bearer token or userId)
    if (!userId) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        // Support both "Bearer <token>" and "UserId <id>" formats
        const parts = authHeader.split(' ')
        if (parts.length === 2) {
          if (parts[0].toLowerCase() === 'bearer') {
            userId = parts[1]
          } else if (parts[0].toLowerCase() === 'userid') {
            userId = parts[1]
          }
        } else if (parts.length === 1) {
          // Just the userId
          userId = parts[0]
        }
      }
    }

    // Fallback: try to get from query params (for backward compatibility, but less secure)
    if (!userId) {
      const searchParams = request.nextUrl.searchParams
      userId = searchParams.get('userId')
    }

    // Fallback: try to get from request body (for POST requests)
    if (!userId) {
      try {
        const clone = request.clone()
        const body = await clone.json().catch(() => null)
        if (body && body.userId) {
          userId = body.userId
        }
      } catch {
        // Body parsing failed, continue without it
      }
    }

    if (!userId) {
      return {
        authenticated: false,
        error: 'User ID is required'
      }
    }

    // Verify user exists in database
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error verifying user:', error)
      return {
        authenticated: false,
        error: 'Failed to verify user'
      }
    }

    if (!user) {
      return {
        authenticated: false,
        error: 'User not found'
      }
    }

    return {
      authenticated: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      }
    }
  } catch (error: any) {
    console.error('Auth verification error:', error)
    return {
      authenticated: false,
      error: error.message || 'Authentication failed'
    }
  }
}

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/pricing',
    '/contact',
    '/success',
    '/cancel',
    '/setup',
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/setup',
    '/api/webhooks',
    '/api/track-free-signup',
    '/api/checkout',
    '/api/creem/checkout'
  ]

  return publicRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if an API route is public (doesn't require authentication)
 */
export function isPublicApiRoute(pathname: string): boolean {
  const publicApiRoutes = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/logout',
    '/api/setup',
    '/api/webhooks',
    '/api/track-free-signup',
    '/api/checkout',
    '/api/creem/checkout',
    '/api/setup/status',
    '/api/setup/env-vars',
    '/api/setup/creem-env-vars'
  ]

  return publicApiRoutes.some(route => pathname.startsWith(route))
}

