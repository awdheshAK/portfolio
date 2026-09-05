import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        const protectedPrefixes = ['/admin', '/dashboard', '/upload', '/account'];
        if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
          return Boolean(token);
        }
        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  },
);

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/upload/:path*', '/account/:path*'],
};
