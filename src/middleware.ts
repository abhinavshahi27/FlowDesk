import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedApiRoutes = ['/api/projects', '/api/tasks', '/api/users'];
const protectedPageRoutes = ['/dashboard', '/projects', '/tasks', '/team'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route));
  const isPageRoute = protectedPageRoutes.some((route) => pathname.startsWith(route));

  if (!isApiRoute && !isPageRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const payload = await verifyToken(token);
  
  if (!payload) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Adding the user ID to headers so API routes can easily retrieve it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
