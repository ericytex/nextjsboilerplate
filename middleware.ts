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

  // For all other paths, check setup status
  // Note: We can't use async fetch in middleware easily, so we'll let the setup page handle the check
  // The setup page will redirect if setup is complete
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

