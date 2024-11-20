/* eslint-disable @typescript-eslint/no-unused-vars */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

interface Session {
  access_token: string;
  refresh_token: string;
}

interface SessionRequest {
  session: Session;
}

export async function POST(request: Request) {
  try {
    const { session }: SessionRequest = await request.json();
    
    if (!session || !session.access_token || !session.refresh_token) {
      return NextResponse.json(
        { error: 'Invalid session data', details: 'Missing required session tokens' },
        { status: 400 }
      );
    }

    // Initialize supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // First try to get the current session
    const { data: { session: currentSession }, error: getCurrentError } = await supabase.auth.getSession();
    
    if (getCurrentError) {
      console.error('Error getting current session:', getCurrentError);
      return NextResponse.json(
        { error: 'Failed to get current session', details: getCurrentError },
        { status: 500 }
      );
    }

    // Set the session
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token
    });

    if (setSessionError) {
      console.error('Failed to set session:', setSessionError);
      return NextResponse.json(
        { error: 'Failed to set session', details: setSessionError },
        { status: setSessionError.status || 401 }
      );
    }

    // Verify the session was set correctly
    const { data: { session: verifiedSession }, error: verifyError } = await supabase.auth.getSession();

    if (verifyError || !verifiedSession) {
      console.error('Session verification failed:', verifyError);
      return NextResponse.json(
        { error: 'Session verification failed', details: verifyError },
        { status: 401 }
      );
    }

    // Create response with session and proper headers
    const response = NextResponse.json({
      message: 'Session synced successfully',
      session: verifiedSession,
      user: verifiedSession.user
    });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');

    return response;
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session retrieval error:', error);
      return NextResponse.json(
        { error: 'Session error', details: error },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No active session', details: 'User is not authenticated' },
        { status: 401 }
      );
    }

    // Create response with session and proper headers
    const response = NextResponse.json({ session, user: session.user });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');

    return response;
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Signout error:', error);
      return NextResponse.json(
        { error: 'Failed to sign out', details: error },
        { status: 500 }
      );
    }

    // Create response with proper headers
    const response = NextResponse.json({ message: 'Signed out successfully' });

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');

    return response;
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, {
    status: 204,
  });

  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}
