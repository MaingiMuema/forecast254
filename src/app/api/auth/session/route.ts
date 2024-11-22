/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface Session {
  access_token: string;
  refresh_token: string;
  user?: any;
}

interface SessionRequest {
  session: Session;
}

// Helper function to create response with CORS headers
function createCorsResponse(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_SITE_URL || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

// Helper function to copy auth cookies to response
async function copyAuthCookiesToResponse(response: NextResponse) {
  const cookieStore = await cookies();
  const authCookies = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token'
  ];

  for (const name of authCookies) {
    const cookie = cookieStore.get(name);
    if (cookie) {
      response.headers.append('Set-Cookie', cookie.value);
    }
  }
  return response;
}

export async function POST(request: Request) {
  try {
    const { session }: SessionRequest = await request.json();
    
    if (!session?.access_token || !session?.refresh_token) {
      return createCorsResponse(
        NextResponse.json(
          { error: 'Invalid session data' },
          { status: 400 }
        )
      );
    }

    // Create response with session cookie
    const response = NextResponse.json(
      { status: 'success' },
      { status: 200 }
    );

    // Set auth cookies with proper attributes
    const secure = process.env.NODE_ENV === 'production';
    const sameSite = secure ? 'strict' : 'lax';
    const domain = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').hostname;

    response.cookies.set('sb-access-token', session.access_token, {
      path: '/',
      secure,
      sameSite,
      domain,
      maxAge: 3600,
      httpOnly: true
    });

    response.cookies.set('sb-refresh-token', session.refresh_token, {
      path: '/',
      secure,
      sameSite,
      domain,
      maxAge: 7200,
      httpOnly: true
    });

    // Store session data
    const supabase = createRouteHandlerClient<Database>({ cookies });
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    return createCorsResponse(response);
  } catch (error) {
    console.error('Error setting session:', error);
    return createCorsResponse(
      NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    );
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookies()
    });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return createCorsResponse(
        NextResponse.json(
          { error: 'Failed to get session', details: error },
          { status: 500 }
        )
      );
    }

    // Create response with session data
    const response = NextResponse.json({ session });

    // Copy auth cookies to response
    return await createCorsResponse(await copyAuthCookiesToResponse(response));

  } catch (error) {
    console.error('Error in GET session:', error);
    return createCorsResponse(
      NextResponse.json(
        { error: 'Internal server error', details: error },
        { status: 500 }
      )
    );
  }
}

export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookies()
    });

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return createCorsResponse(
        NextResponse.json(
          { error: 'Failed to sign out', details: error },
          { status: 500 }
        )
      );
    }

    // Create response
    const response = NextResponse.json(
      { message: 'Signed out successfully' },
      { status: 200 }
    );

    // List of all possible auth cookies
    const authCookies = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__session',
      'sb-provider-token'
    ];

    // Clear all auth cookies with proper attributes
    for (const name of authCookies) {
      response.headers.append(
        'Set-Cookie',
        `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; HttpOnly; SameSite=Lax`
      );
    }

    return createCorsResponse(response);
  } catch (error) {
    console.error('Error in DELETE session:', error);
    return createCorsResponse(
      NextResponse.json(
        { error: 'Internal server error', details: error },
        { status: 500 }
      )
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_SITE_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });
}
