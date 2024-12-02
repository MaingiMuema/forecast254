/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh session if expired
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error in middleware:', sessionError);
      // Don't throw, continue with null session
    }

    const protectedPaths = [
      '/dashboard',
      '/markets/create',
      '/api/markets/trade',
      '/api/markets/positions',
      '/dashboard/portfolio',
      '/dashboard/trades',
      '/dashboard/settings',
      '/dashboard/analysis'
    ];

    const authOnlyPaths = [
      '/login',
      '/register',
      '/forgot-password'
    ];

    const isProtectedPath = protectedPaths.some(path => 
      req.nextUrl.pathname.startsWith(path)
    );

    const isAuthOnlyPath = authOnlyPaths.some(path =>
      req.nextUrl.pathname.startsWith(path)
    );

    // Redirect authenticated users away from auth-only routes
    if (session && isAuthOnlyPath) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // If accessing protected routes without auth, handle appropriately
    if (!session && isProtectedPath) {
      // For API routes, return 401 JSON response
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED'
          }),
          { 
            status: 401,
            headers: { 
              'Content-Type': 'application/json',
              'WWW-Authenticate': 'Bearer'
            }
          }
        );
      }
      
      // For page routes, redirect to login with return URL
      const returnTo = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/markets/:path*',
    '/api/user/:path*'
  ]
};
