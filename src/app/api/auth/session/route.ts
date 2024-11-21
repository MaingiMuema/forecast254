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
    
    if (!session || !session.access_token || !session.refresh_token) {
      console.error('Invalid session data:', { session });
      return createCorsResponse(
        NextResponse.json(
          { error: 'Invalid session data', details: 'Missing required session tokens' },
          { status: 400 }
        )
      );
    }

    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookies()
    });

    try {
      // Set the session
      const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      if (setSessionError) {
        console.error('Failed to set session:', setSessionError);
        return createCorsResponse(
          NextResponse.json(
            { error: 'Failed to set session', details: setSessionError },
            { status: 500 }
          )
        );
      }

      if (!sessionData.session) {
        console.error('No session returned after setting session');
        return createCorsResponse(
          NextResponse.json(
            { error: 'Session not set', details: 'No session returned' },
            { status: 500 }
          )
        );
      }

      // Create response with session data
      const response = NextResponse.json({
        message: 'Session updated successfully',
        user: session.user || sessionData.session.user
      });

      // Copy auth cookies to response
      return await createCorsResponse(await copyAuthCookiesToResponse(response));

    } catch (error) {
      console.error('Error in session handling:', error);
      return createCorsResponse(
        NextResponse.json(
          { error: 'Internal server error', details: error },
          { status: 500 }
        )
      );
    }

  } catch (error) {
    console.error('Error parsing request:', error);
    return createCorsResponse(
      NextResponse.json(
        { error: 'Invalid request', details: error },
        { status: 400 }
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
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

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
