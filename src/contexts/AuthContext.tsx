/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    if (!session || !session.access_token || !session.refresh_token) {
      console.log('Invalid session data for sync');
      clearAuthData();
      return false;
    }

    try {
      console.log('Syncing session for user:', session.user?.email);

      // First verify the session is still valid
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('Session validation failed:', userError || 'No user found');
        clearAuthData();
        return false;
      }

      // Update local state with session user
      setUser(currentUser);
      
      // Now sync with our API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            user: currentUser
          }
        }),
        credentials: 'include',
        cache: 'no-store'
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to sync session:', response.status, data);
        return false;
      }

      console.log('Session synced successfully');
      return true;
    } catch (error) {
      console.error('Session sync error:', error);
      return false;
    }
  };

  // Navigation helper
  const navigateIfNeeded = (shouldNavigate: boolean, path: string) => {
    if (shouldNavigate) {
      router.push(path);
    }
  };

  // Handle successful login navigation
  const handleSuccessfulLogin = () => {
    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      router.push(decodeURIComponent(redirectTo));
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...');
        setLoading(true);
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          clearAuthData();
          setLoading(false);
          return;
        }

        if (!session) {
          console.log('No initial session found');
          clearAuthData();
          setLoading(false);
          return;
        }

        // Validate session has required data
        if (!session.access_token || !session.refresh_token) {
          console.error('Missing session tokens');
          clearAuthData();
          setLoading(false);
          return;
        }

        if (!session.user?.id || !session.user?.email) {
          console.error('Invalid user data in session');
          clearAuthData();
          setLoading(false);
          return;
        }

        // Try to sync the session
        const synced = await syncSession(session);
        
        if (!synced && retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying session sync (attempt ${retryCount}/${MAX_RETRIES})...`);
          setTimeout(initializeAuth, RETRY_DELAY * retryCount);
          return;
        }

        if (!synced) {
          console.error('Failed to sync session after retries');
          clearAuthData();
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
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
              navigateIfNeeded(pathname !== '/login', '/login');
              break;

            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
            case 'INITIAL_SESSION':
              if (!session) {
                console.log('No session data received for event:', event);
                clearAuthData();
                navigateIfNeeded(pathname !== '/login', '/login');
                return;
              }

              // Validate session data
              if (!session.access_token || !session.refresh_token) {
                console.log('Missing session tokens for event:', event);
                clearAuthData();
                navigateIfNeeded(pathname !== '/login', '/login');
                return;
              }

              if (!session.user?.id || !session.user?.email) {
                console.log('Invalid user data in session for event:', event);
                clearAuthData();
                navigateIfNeeded(pathname !== '/login', '/login');
                return;
              }

              console.log(`${event} event for user:`, session.user.email);
              
              // Try to sync session
              if (!await syncSession(session)) {
                console.log('Failed to sync session for event:', event);
                clearAuthData();
                navigateIfNeeded(pathname !== '/login', '/login');
                return;
              }
                
              if (event === 'SIGNED_IN') {
                handleSuccessfulLogin();
              }
              break;

            default:
              // For any other events, verify the session is valid
              if (!session) {
                clearAuthData();
                navigateIfNeeded(pathname !== '/login', '/login');
                return;
              }

              // Validate session data
              if (!session.access_token || !session.refresh_token || !session.user?.id) {
                console.log('Invalid session data in default case');
                clearAuthData();
                navigateIfNeeded(pathname !== '/login', '/login');
                return;
              }

              // Try to sync session
              if (!await syncSession(session)) {
                clearAuthData();
                navigateIfNeeded(pathname !== '/login', '/login');
              }
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          clearAuthData();
          navigateIfNeeded(pathname !== '/login', '/login');
        }
      }
    );

    // Initialize auth state
    initializeAuth();

    // Cleanup
    return () => {
      console.log('Cleaning up auth state...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname, searchParams]);

  const signUp = async (email: string, password: string, metadata: Record<string, any>) => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (response.error) {
        console.error('Sign up error:', response.error);
      }

      return response;
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (response.error) {
        console.error('Sign in error:', response.error);
        clearAuthData();
      }

      return response;
    } catch (error) {
      console.error('Sign in error:', error);
      clearAuthData();
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      // First, try to clear server-side session
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Failed to clear server session:', response.status);
        // Continue with client-side sign out even if server-side fails
      }

      // Sign out from Supabase client
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }

      // Clear local state regardless of server response
      clearAuthData();
      
      // Redirect to login page
      router.push('/login');

    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state and redirect on error
      clearAuthData();
      router.push('/login');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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
