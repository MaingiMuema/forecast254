/* eslint-disable @typescript-eslint/no-explicit-any */
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from '@/lib/analytics';

// Function to check if the path should be tracked
const shouldTrackPath = (pathname: string): boolean => {
  // Skip tracking for API routes, static files, and other non-page routes
  const excludedPatterns = [
    /^\/api\//,
    /\.(ico|png|jpg|jpeg|css|js|svg)$/,
    /^\/favicon/,
    /^\/\_next\//,
  ];
  
  return !excludedPatterns.some(pattern => pattern.test(pathname));
};

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

    // Track analytics if it's a trackable path
    if (shouldTrackPath(req.nextUrl.pathname)) {
      const sessionId = req.cookies.get('session_id')?.value || uuidv4();
      
      // Set or refresh session cookie
      res.cookies.set('session_id', sessionId, {
        maxAge: 60 * 60 * 24, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      // Record page view using analytics service
      await analyticsService.trackPageView({
        path: req.nextUrl.pathname,
        session_id: sessionId,
        user_id: session?.user?.id,
        referrer: req.headers.get('referer') || undefined,
        user_agent: req.headers.get('user-agent') || undefined,
      });
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

    // Redirect unauthenticated users away from protected routes
    if (!session && isProtectedPath) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
