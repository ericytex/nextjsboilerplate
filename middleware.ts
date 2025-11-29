import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow these paths without checking setup status
  const allowedPaths = [
    '/api',
    '/setup',
    '/_next',
    '/signin',
    '/signup',
    '/pricing',
    '/contact',
    '/success',
    '/cancel'
  ]

  const isAllowed = allowedPaths.some(path => pathname.startsWith(path))

  if (isAllowed) {
    return NextResponse.next()
  }

  // For all other paths, check if setup is needed
  // Check if Supabase is configured via environment variables
  // Support both new (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) and old (NEXT_PUBLIC_SUPABASE_ANON_KEY) key names
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // If no Supabase URL or key in environment, redirect to setup
  // The setup page will check if database is actually configured and redirect if already complete
  if (!supabaseUrl || !supabaseKey) {
    // Only redirect if not already on setup page
    if (pathname !== '/setup') {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
  }

  // If we have Supabase URL and key, allow the request through
  // The setup page will check if admin exists and redirect to dashboard if setup is complete
  // The dashboard and other pages will check authentication separately
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

