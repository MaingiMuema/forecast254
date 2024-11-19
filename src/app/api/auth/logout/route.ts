/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookies()
    });

    await supabase.auth.signOut();
    
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear all auth-related cookies
    const cookieStore = cookies();
    const cookiesToClear = (await cookieStore).getAll();
    cookiesToClear.forEach(cookie => {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.delete(cookie.name);
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Internal server error during logout' },
      { status: 500 }
    );
  }
}
