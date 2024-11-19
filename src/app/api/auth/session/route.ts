import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { session } = await request.json();

    if (session) {
      // Set session cookie
      await supabase.auth.setSession(session);
      return NextResponse.json({ status: 'success' });
    } else {
      return NextResponse.json({ error: 'No session provided' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error setting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
