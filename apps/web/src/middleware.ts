import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route protection middleware.
 *
 * We defer to NextAuth v5's authorized() callback for "is user logged in?".
 * Role-based checks happen server-side in each layout using the session.
 *
 * This middleware enforces the basic URL prefix → role mapping:
 *   /factory/*  → OWNER or MANAGER
 *   /agency/*   → AGENCY_ADMIN
 *   /ca/*       → CA
 *
 * The full check runs at page level. Here we only redirect unauthenticated
 * users to /login when they try to hit a protected route.
 */
export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  const needsAuth =
    pathname.startsWith('/factory') ||
    pathname.startsWith('/agency') ||
    pathname.startsWith('/ca');

  if (!needsAuth) return NextResponse.next();

  // Session cookie is set by NextAuth v5; check its presence.
  const session =
    req.cookies.get('authjs.session-token') ?? req.cookies.get('__Secure-authjs.session-token');

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/factory/:path*', '/agency/:path*', '/ca/:path*'],
};
