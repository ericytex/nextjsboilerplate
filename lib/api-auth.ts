/**
 * API Route Authentication Helper
 * Use this in API routes to verify authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, isPublicApiRoute } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  userId: string
  user: {
    id: string
    email: string
    fullName: string | null
    role: string
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 * Returns authenticated request or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ authenticated: true; request: AuthenticatedRequest } | { authenticated: false; response: NextResponse }> {
  const { pathname } = request.nextUrl

  // Check if this is a public API route
  if (isPublicApiRoute(pathname)) {
    // For public routes, we still need to return a response
    // but we'll let the route handle it
    return {
      authenticated: false,
      response: NextResponse.next()
    }
  }

  // Verify authentication
  const authResult = await verifyAuth(request)

  if (!authResult.authenticated || !authResult.userId || !authResult.user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: authResult.error || 'Please sign in to access this resource'
        },
        { status: 401 }
      )
    }
  }

  // Add user info to request (we'll need to pass it through context)
  // For now, we'll return the auth result and let the route use it
  return {
    authenticated: true,
    request: request as AuthenticatedRequest
  }
}

/**
 * Get authenticated user from request
 * Use this in API routes to get user info
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const authResult = await verifyAuth(request)
  
  if (!authResult.authenticated || !authResult.userId || !authResult.user) {
    return null
  }

  return {
    userId: authResult.userId,
    user: authResult.user
  }
}


