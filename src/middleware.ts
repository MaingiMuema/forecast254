import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/_next',
  '/favicon.ico',
  '/public'
];

// List of auth-related API routes that handle their own auth
const authApiRoutes = [
  '/api/auth/session',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout'
];

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/markets',
  '/portfolio',
  '/settings',
  '/api/market-generation',
  '/api/market-data',
  '/api/user'
];

// Helper function to check if a path starts with any of the routes
const pathStartsWith = (path: string, routes: string[]) => {
  return routes.some(route => path.startsWith(route));
};

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    
    // Skip middleware for public files
    if (pathStartsWith(pathname, publicRoutes)) {
      return NextResponse.next();
    }

    // Skip middleware for auth API routes as they handle their own auth
    if (pathStartsWith(pathname, authApiRoutes)) {
      return NextResponse.next();
    }

    // Create a response object that we'll modify and return
    const response = NextResponse.next();

    // Create Supabase client specific to this request
    const supabase = createMiddlewareClient({ 
      req: request,
      res: response,
    });

    // Refresh session if expired and get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error in middleware:', sessionError);
      return redirectToLogin(request, 'session_error');
    }

    // Verify user exists if we have a session
    if (session) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User verification failed in middleware:', userError);
        return redirectToLogin(request, 'invalid_user');
      }
    }

    // If logged in and trying to access login/register pages, redirect to dashboard
    if (session && (pathname === '/login' || pathname === '/register')) {
      console.log('Middleware - Redirecting to dashboard (logged in user on auth page)');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // For the root path ('/'), allow access regardless of auth status
    if (pathname === '/') {
      return response;
    }

    // Check if the current route requires authentication
    const requiresAuth = pathStartsWith(pathname, protectedRoutes);

    // If route requires auth and user is not logged in, redirect to login
    if (requiresAuth && !session) {
      console.log('Middleware - Redirecting to login (protected route, no session)');
      return redirectToLogin(request, 'auth_required', pathname);
    }

    // Allow access to the route
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return redirectToLogin(request, 'middleware_error');
  }
}

// Helper function to handle login redirects
function redirectToLogin(request: NextRequest, error: string, redirectTo?: string) {
  const url = new URL('/login', request.url);
  if (error) url.searchParams.set('error', error);
  if (redirectTo) url.searchParams.set('redirectTo', redirectTo);
  return NextResponse.redirect(url);
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
