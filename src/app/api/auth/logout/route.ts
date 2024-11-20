/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export async function POST() {
  try {
    // Get cookie store (no need to await)
    const cookieStore = cookies();
    
    // Create Supabase client with cookie store
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore
    });

    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Create response
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear the auth cookie if it exists
    response.cookies.delete('sb-wupwpxcyolbttlbaiayk-auth-token');

    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
