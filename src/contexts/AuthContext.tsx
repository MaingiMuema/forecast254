/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type AuthResponse = {
  data: {
    user: User | null;
    session: Session | null;
  } | null;
  error: AuthError | null;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: Record<string, any>) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, session: Session | null) => {
            console.log('Auth state changed:', event, session?.user?.email);
            
            if (mounted) {
              setUser(session?.user ?? null);
            }

            if (session) {
              // Sync session with our API
              try {
                const response = await fetch('/api/auth/session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ session }),
                });

                if (!response.ok) {
                  throw new Error('Failed to sync session');
                }

                if (event === 'SIGNED_IN') {
                  router.refresh();
                }
              } catch (error) {
                console.error('Session sync error:', error);
              }
            } else if (event === 'SIGNED_OUT') {
              // Clear session in API
              try {
                await fetch('/api/auth/session', {
                  method: 'DELETE',
                });
                router.refresh();
              } catch (error) {
                console.error('Session clear error:', error);
              }
            }
          }
        );

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [router]);

  const signUp = async (email: string, password: string, metadata: Record<string, any>) => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      if (response.data.session) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: response.data.session }),
        });
      }

      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', response);

      if (response.error) {
        console.error('Sign in error:', response.error);
        throw response.error;
      }

      if (response.data.session) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session: response.data.session }),
        });
      }

      return response;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // First clear the session in our API
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API signout error:', error);
      }

      // Clear local state regardless of API response
      setUser(null);

      // Clear any local storage
      if (typeof window !== 'undefined') {
        const storageKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`;
        window.localStorage.removeItem(storageKey);
      }
      
      // Finally redirect
      router.refresh();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear state and redirect even if there's an error
      setUser(null);
      router.refresh();
      router.push('/login');
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
