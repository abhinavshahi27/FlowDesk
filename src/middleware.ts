import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const protectedApiRoutes = ['/api/projects', '/api/tasks', '/api/users'];
const protectedPageRoutes = ['/dashboard', '/projects', '/tasks', '/team'];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isApiRoute = protectedApiRoutes.some((route) => pathname.startsWith(route));
  const isPageRoute = protectedPageRoutes.some((route) => pathname.startsWith(route));

  if ((isApiRoute || isPageRoute) && !user) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
