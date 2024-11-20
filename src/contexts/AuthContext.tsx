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

  // Function to clear all auth-related data
  const clearAuthData = () => {
    // Clear state
    setUser(null);

    // Clear local storage
    if (typeof window !== 'undefined') {
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
      if (projectId) {
        window.localStorage.removeItem(`sb-${projectId}-auth-token`);
        window.localStorage.removeItem('supabase.auth.token');
        window.localStorage.removeItem('supabase.auth.expires');
        window.localStorage.removeItem('supabase.auth.data');
      }
    }

    // Clear cookies
    const cookies = [
      'sb:token',
      'sb:session',
      'sb-access-token',
      'sb-refresh-token'
    ];

    cookies.forEach(cookie => {
      document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
      document.cookie = `${cookie}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    });
  };

  // Function to sync session with API
  const syncSession = async (session: Session | null) => {
    if (!session) {
      console.log('No session to sync');
      return false;
    }

    try {
      console.log('Syncing session for user:', session.user?.email);
      
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token
          }
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to sync session:', data.error, data.details);
        
        // Handle specific error cases
        switch (response.status) {
          case 400:
            console.error('Invalid session data provided');
            clearAuthData();
            return false;
          case 401:
            console.error('Session unauthorized');
            clearAuthData();
            return false;
          case 403:
            console.error('Session forbidden');
            clearAuthData();
            return false;
          case 500:
            console.error('Server error during session sync');
            // Don't clear auth data for server errors, might be temporary
            return false;
          default:
            console.warn('Non-critical session sync error:', response.status);
            // Keep session for unknown errors
            return true;
        }
      }

      // Update local state with session user
      if (data.user) {
        setUser(data.user);
      }

      console.log('Session synced successfully');
      return true;
    } catch (error) {
      console.error('Session sync error:', error);
      // Only clear auth data for network errors
      if (error instanceof TypeError) {
        clearAuthData();
        return false;
      }
      // Keep session for other errors
      return true;
    }
  };

  // Function to get current session
  const getCurrentSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        clearAuthData();
        return null;
      }

      if (!session) {
        console.log('No current session found');
        clearAuthData();
        return null;
      }

      console.log('Got current session for user:', session.user?.email);
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      clearAuthData();
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        setLoading(true);
        
        const session = await getCurrentSession();
        if (!mounted) return;

        if (session?.user) {
          console.log('Setting initial user state:', session.user.email);
          setUser(session.user);
          const synced = await syncSession(session);
          
          // Retry logic for session sync
          if (!synced && retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Retrying session sync (attempt ${retryCount}/${MAX_RETRIES})...`);
            setTimeout(initializeAuth, 1000 * retryCount); // Exponential backoff
            return;
          }
        } else {
          console.log('No initial session found');
          clearAuthData();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying auth initialization (attempt ${retryCount}/${MAX_RETRIES})...`);
          setTimeout(initializeAuth, 1000 * retryCount);
          return;
        }
        clearAuthData();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (!mounted) return;

        try {
          switch (event) {
            case 'SIGNED_OUT':
              console.log('User signed out');
              clearAuthData();
              router.push('/login');
              break;

            case 'SIGNED_IN':
              if (session?.user) {
                console.log('User signed in:', session.user.email);
                setUser(session.user);
                const synced = await syncSession(session);
                if (synced) {
                  router.refresh();
                }
              }
              break;

            case 'TOKEN_REFRESHED':
              if (session?.user) {
                console.log('Token refreshed for user:', session.user.email);
                setUser(session.user);
                await syncSession(session);
              }
              break;

            case 'INITIAL_SESSION':
              if (session?.user) {
                console.log('Initial session detected:', session.user.email);
                setUser(session.user);
                await syncSession(session);
              }
              break;

            default:
              if (session?.user) {
                setUser(session.user);
              } else {
                clearAuthData();
              }
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          clearAuthData();
        }
      }
    );

    initializeAuth();

    return () => {
      console.log('Cleaning up auth state...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // First call Supabase signOut
      const { error: supabaseError } = await supabase.auth.signOut();
      if (supabaseError) {
        console.error('Supabase signout error:', supabaseError);
      }

      // Call our logout endpoint
      const logoutResponse = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!logoutResponse.ok) {
        const error = await logoutResponse.json();
        console.error('Logout API error:', error);
      }

      // Clear session in our session endpoint
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!sessionResponse.ok) {
        const error = await sessionResponse.json();
        console.error('Session API error:', error);
      }

      // Clear all auth data
      clearAuthData();

      // Force a router refresh and redirect
      console.log('Redirecting to login...');
      router.refresh();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear state and redirect even if there's an error
      clearAuthData();
      router.refresh();
      router.push('/login');
    }
  };

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

      if (response.error) {
        console.error('Sign in error:', response.error);
        throw response.error;
      }

      return response;
    } catch (error) {
      console.error('Sign in error:', error);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
