/* eslint-disable @typescript-eslint/no-unused-vars */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/_next',
  '/favicon.ico',
  '/public',
  '/api/auth',
  '/',
  '/markets' // Making markets public as per recent change
];

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/portfolio',
  '/settings',
  '/api/market-generation',
  '/api/market-data',
  '/api/user'
];

// Helper function to check if a path matches any of the routes
const pathStartsWith = (path: string, routes: string[]) => {
  return routes.some(route => path.startsWith(route));
};

export async function middleware(request: NextRequest) {
  try {
    // Create a Supabase client for this request
    const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get the requested path
    const path = request.nextUrl.pathname;
    
    // Handle authentication state
    const isAuthenticated = !!session;
    const isPublicRoute = pathStartsWith(path, publicRoutes);
    const isProtectedRoute = pathStartsWith(path, protectedRoutes);
    
    // Case 1: Accessing auth pages while authenticated
    if (isAuthenticated && (path === '/login' || path === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Case 2: Accessing protected route while not authenticated
    if (!isAuthenticated && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', encodeURIComponent(path));
      return NextResponse.redirect(redirectUrl);
    }
    
    // Case 3: Public routes are always accessible
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    // Case 4: All other routes proceed normally if authenticated
    if (isAuthenticated) {
      return NextResponse.next();
    }
    
    // Default: Redirect to login for unknown routes when not authenticated
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', encodeURIComponent(path));
    return NextResponse.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login with error parameter
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
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
