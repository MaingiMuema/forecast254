/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, Session, WeakPassword } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type AuthResponse = {
  data: {
    user: User | null;
    session: Session | null;
    weakPassword?: WeakPassword;
  } | null;
  error: AuthError | null;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: any) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session) {
        // Ensure the session cookie is set
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session }),
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Signup error:', error);
        return { data: null, error } as AuthResponse;
      }

      // If signup is successful but needs email confirmation
      if (data?.user && !data?.session) {
        return {
          data,
          error: null,
        } as AuthResponse;
      }

      return { data, error: null } as AuthResponse;
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return {
        data: null,
        error: new AuthError('An unexpected error occurred. Please try again.'),
      } as AuthResponse;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        let errorMessage = 'Invalid login credentials.';
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'The email or password you entered is incorrect.';
            break;
          case 'Email not confirmed':
            errorMessage = 'Please confirm your email address before logging in.';
            break;
          case 'Too many requests':
            errorMessage = 'Too many login attempts. Please try again later.';
            break;
          default:
            errorMessage = error.message;
        }

        return {
          data: null,
          error,
        } as AuthResponse;
      }

      // Ensure the session cookie is set after successful login
      if (data.session) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session: data.session }),
        });
      }

      return { data, error: null } as AuthResponse;
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return {
        data: null,
        error: new AuthError('An unexpected error occurred. Please try again.'),
      } as AuthResponse;
    }
  };

  const signOut = async () => {
    try {
      // First clear the session on the client side
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Then clear session cookies via API
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'same-origin' // Important for cookie handling
      });

      // Force clear user state
      setUser(null);
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
