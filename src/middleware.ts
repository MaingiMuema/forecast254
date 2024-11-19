import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register'];

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const res = NextResponse.next();

  try {
    // Create Supabase client specific to this request
    const supabase = createMiddlewareClient({ req: request, res });

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Add session token to response headers
    if (session) {
      res.headers.set('x-session-user', session.user.email || '');
    }

    const pathname = request.nextUrl.pathname;
    console.log('Middleware - Path:', pathname);
    console.log('Middleware - Session:', session ? 'Exists' : 'None');

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // If logged in and trying to access login/register pages, redirect to dashboard
    if (session && (pathname === '/login' || pathname === '/register')) {
      console.log('Middleware - Redirecting to dashboard (logged in user on auth page)');
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      // Copy over the session cookie
      const sessionCookie = request.cookies.get('sb-auth-token');
      if (sessionCookie) {
        response.cookies.set('sb-auth-token', sessionCookie.value, {
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });
      }
      return response;
    }

    // If not logged in and trying to access protected route, redirect to login
    if (!session && !isPublicRoute && pathname.startsWith('/dashboard')) {
      console.log('Middleware - Redirecting to login (no session on protected route)');
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Add auth cookie to response
    const authCookie = request.cookies.get('sb-auth-token');
    if (authCookie) {
      res.cookies.set('sb-auth-token', authCookie.value, {
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
