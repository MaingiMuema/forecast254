import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/api/auth/session'];

export async function middleware(request: NextRequest) {
  try {
    // Create a response object that we'll modify and return
    const response = NextResponse.next();

    // Create Supabase client specific to this request
    const supabase = createMiddlewareClient({ 
      req: request,
      res: response,
    });

    // Refresh session if expired
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    const pathname = request.nextUrl.pathname;
    console.log('Middleware - Path:', pathname);
    console.log('Middleware - Session:', session ? 'Exists' : 'None');

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // If logged in and trying to access login/register pages, redirect to dashboard
    if (session && (pathname === '/login' || pathname === '/register')) {
      console.log('Middleware - Redirecting to dashboard (logged in user on auth page)');
      const redirectUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // If not logged in and trying to access protected route, redirect to login
    if (!session && !isPublicRoute) {
      console.log('Middleware - Redirecting to login (no session on protected route)');
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Set cookie for session
    if (session) {
      response.cookies.set('sb:session', session.access_token, {
        maxAge: 3600,
        path: '/',
        sameSite: 'lax',
        secure: true,
      });
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, redirect to login with error parameter
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'auth_error');
    return NextResponse.redirect(redirectUrl);
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
