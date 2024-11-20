import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client with service role for admin operations
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, first_name, last_name, phone } = await request.json();

    if (!email || !password || !first_name || !last_name || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if phone number already exists using the admin client
    const { data: existingProfile, error: phoneCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single();

    if (phoneCheckError && phoneCheckError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Phone check error:', phoneCheckError);
      return NextResponse.json(
        { message: 'Error checking phone number availability' },
        { status: 500 }
      );
    }

    if (existingProfile) {
      return NextResponse.json(
        { message: 'Phone number is already registered' },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        phone,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { message: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Insert into profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        first_name,
        last_name,
        phone,
        balance: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Handle profile creation error
      if (profileError.code === '23505') { // PostgreSQL unique violation error code
        if (profileError.message.includes('profiles_phone_key')) {
          await supabase.auth.admin.deleteUser(authData.user.id);
          return NextResponse.json(
            { message: 'Phone number is already registered' },
            { status: 400 }
          );
        }
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { message: 'Account already exists' },
          { status: 400 }
        );
      }

      // For other errors, clean up by deleting the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { message: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Account created successfully',
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
