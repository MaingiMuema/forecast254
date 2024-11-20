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
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'No session provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    await supabase.auth.setSession(session);

    return NextResponse.json({ message: 'Session synced successfully' });
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    
    // Clear auth cookie manually first
    const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`;
    cookieStore.delete(cookieName);
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Supabase signOut error:', error);
    }

    return new NextResponse(null, { 
      status: 204,
      headers: {
        'Set-Cookie': `${cookieName}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`
      }
    });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
