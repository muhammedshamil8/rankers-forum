import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = [
  '/',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
];

const roleRoutes: Record<string, string[]> = {
  '/student': ['student'],
  '/admin': ['admin', 'super_admin'],
  '/super-admin': ['super_admin'],
  '/api/students': ['student'],
  '/api/admin': ['admin', 'super_admin'],
  '/api/super-admin': ['super_admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api/');
  const isProtectedPage = Object.keys(roleRoutes).some(
    route => pathname.startsWith(route)
  );

  if (!isApiRoute && !isProtectedPage) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('session')?.value;

  // if (!sessionCookie) {
  //   if (isApiRoute) {
  //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  //   }
  // return NextResponse.redirect(new URL('/', request.url));
  // }

  if (isApiRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
