/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: any) => Promise<{
    error: AuthError | null;
    data: any;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: AuthError | null;
    data: any;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
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
        return { error, data: null };
      }

      // If signup is successful but needs email confirmation
      if (data?.user && !data?.session) {
        return {
          data,
          error: {
            name: 'EmailConfirmationRequired',
            message: 'Please check your email for a confirmation link to complete your registration.',
          } as AuthError,
        };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return {
        data: null,
        error: {
          name: 'UnexpectedError',
          message: 'An unexpected error occurred. Please try again.',
        } as AuthError,
      };
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
          error: {
            ...error,
            message: errorMessage,
          },
          data: null,
        };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return {
        data: null,
        error: {
          name: 'UnexpectedError',
          message: 'An unexpected error occurred. Please try again.',
        } as AuthError,
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
