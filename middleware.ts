import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/icon.svg') ||
    pathname.startsWith('/avatars')
  ) {
    return NextResponse.next()
  }

  // Handle API routes
  if (pathname.startsWith('/api')) {
    // Check if this is a public API route
    const { isPublicApiRoute } = await import('@/lib/auth')
    
    if (isPublicApiRoute(pathname)) {
      // Public API routes don't require authentication
      return NextResponse.next()
    }

    // Protected API routes require authentication
    // First check if setup is complete
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured', needsSetup: true },
        { status: 503 }
      )
    }

    // Verify authentication
    const { verifyAuth } = await import('@/lib/auth')
    const authResult = await verifyAuth(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please sign in to access this resource'
        },
        { status: 401 }
      )
    }

    // User is authenticated, allow access
    return NextResponse.next()
  }

  // Handle page routes
  // Check if route is public (landing page, signin, signup, etc.)
  const { isPublicRoute } = await import('@/lib/auth')
  
  if (isPublicRoute(pathname)) {
    // For public routes, still check if setup is needed
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // If Supabase not configured and not on setup page, redirect to setup
    if ((!supabaseUrl || !supabaseKey) && pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
    
    return NextResponse.next()
  }

  // For protected routes (dashboard, etc.), check authentication
  // First check if setup is complete
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL('/setup', request.url))
  }

  // Check authentication for protected routes
  const { verifyAuth } = await import('@/lib/auth')
  const authResult = await verifyAuth(request)
  
  if (!authResult.authenticated) {
    // Redirect to signin page with return URL
    const signinUrl = new URL('/signin', request.url)
    signinUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signinUrl)
  }

  // User is authenticated, allow access
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg (icon file)
     * - avatars (avatar images)
     * 
     * Note: API routes are handled separately in the middleware function
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|avatars).*)',
  ],
}

