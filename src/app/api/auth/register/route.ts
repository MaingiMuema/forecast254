import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, password, first_name, last_name, phone } = await request.json();

    if (!email || !password || !first_name || !last_name || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          phone,
        },
      },
    });

    if (authError) {
      return NextResponse.json(
        { message: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { message: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile in profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name,
        last_name,
        phone,
        balance: 0,
      });

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      return NextResponse.json(
        { message: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully. Please check your email for verification.',
        user: authData.user 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
