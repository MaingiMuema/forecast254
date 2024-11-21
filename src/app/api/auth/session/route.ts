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

    const supabase = createRouteHandlerClient<Database>({ cookies });

    try {
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
          { status: 500 }
        );
      }

      // Verify the session was set correctly
      const { data: { session: verifiedSession }, error: verifyError } = await supabase.auth.getSession();

      if (verifyError || !verifiedSession) {
        console.error('Session verification failed:', verifyError);
        return NextResponse.json(
          { error: 'Session verification failed', details: verifyError },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Session updated successfully' });

    } catch (error) {
      console.error('Error in session handling:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error parsing request:', error);
    return NextResponse.json(
      { error: 'Invalid request', details: error },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return NextResponse.json(
        { error: 'Failed to get session', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in GET session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return NextResponse.json(
        { error: 'Failed to sign out', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Error in DELETE session:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
