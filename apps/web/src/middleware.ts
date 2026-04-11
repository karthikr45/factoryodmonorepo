import { NextResponse, type NextRequest } from 'next/server';

import { ACCESS_COOKIE } from '@/lib/auth';

/**
 * Route protection middleware.
 *
 * Uses the presence of the FactoryOS access token cookie to decide whether to
 * let a user through. Role-based restriction (factory vs agency vs CA) is still
 * enforced in the server-side page layouts, which call getCurrentUser() and
 * verify the role against the URL prefix.
 */
export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const needsAuth =
    pathname.startsWith('/factory') ||
    pathname.startsWith('/agency') ||
    pathname.startsWith('/ca') ||
    pathname.startsWith('/onboarding');

  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/factory/:path*', '/agency/:path*', '/ca/:path*', '/onboarding'],
};
