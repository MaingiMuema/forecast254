import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analyticsService } from '@/lib/analytics';

export async function analyticsMiddleware(request: NextRequest) {
  // Skip tracking for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|css|js|svg)$/)
  ) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get('session_id')?.value || uuidv4();
  const response = NextResponse.next();

  // Set session cookie if it doesn't exist
  if (!request.cookies.get('session_id')) {
    response.cookies.set('session_id', sessionId, {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // Track page view
  await analyticsService.trackPageView({
    path: request.nextUrl.pathname,
    session_id: sessionId,
    referrer: request.headers.get('referer') || undefined,
    user_agent: request.headers.get('user-agent') || undefined,
  });

  return response;
}
