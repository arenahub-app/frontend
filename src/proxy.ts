import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/v1/')) {
    const backendUrl = process.env.BACKEND_URL
    if (backendUrl) {
      const target = new URL(pathname + request.nextUrl.search, backendUrl)
      return NextResponse.rewrite(target)
    }
  }

  const hasRefreshCookie = request.cookies.has('refresh_token')
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}?`),
  )

  if (!hasRefreshCookie && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasRefreshCookie && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
