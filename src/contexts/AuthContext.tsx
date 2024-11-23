/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';

type AuthResponse = {
  data: {
    user: User | null;
    session: Session | null;
    weakPassword?: any;
  } | null;
  error: any;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: Record<string, any>) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authStateChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safety timeout to prevent infinite loading
  const startLoadingSafetyTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 5000);
  }, []);

  // Debounced set loading state
  const debouncedSetLoading = useCallback((value: boolean) => {
    if (authStateChangeTimeoutRef.current) {
      clearTimeout(authStateChangeTimeoutRef.current);
    }
    authStateChangeTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(value);
      }
    }, 100); // 100ms debounce
  }, []);

  // Clear auth data without automatic redirect
  const clearAuthData = useCallback(async () => {
    if (!mountedRef.current) return;

    setUser(null);
    
    if (typeof window === 'undefined') return;

    // Clear Supabase specific items
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    if (projectId) {
      window.localStorage.removeItem(`sb-${projectId}-auth-token`);
    }

    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    // Clear auth state change timeout
    if (authStateChangeTimeoutRef.current) {
      clearTimeout(authStateChangeTimeoutRef.current);
      authStateChangeTimeoutRef.current = null;
    }

    // Clear server session
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Error clearing server session:', error);
    }
  }, []);

  // Handle navigation
  useEffect(() => {
    if (!router || !pendingRedirect) return;

    const performRedirect = async () => {
      try {
        console.log('Attempting navigation to:', pendingRedirect);
        await router.push(pendingRedirect);
        console.log('Navigation completed successfully');
      } catch (error) {
        console.error('Navigation failed:', error);
      } finally {
        setPendingRedirect(null);
      }
    };

    performRedirect();
  }, [router, pendingRedirect]);

  // Handle successful login
  const handleSuccessfulLogin = useCallback(() => {
    const redirectTo = searchParams?.get('redirectTo');
    const targetPath = redirectTo ? decodeURIComponent(redirectTo) : '/';
    console.log('Setting redirect path to:', targetPath);
    setPendingRedirect(targetPath);
  }, [searchParams]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (!mountedRef.current) return false;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.warn('Session refresh failed:', error);
        return false;
      }

      // Verify session with server
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('Server session verification failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }, []);

  // Start session refresh timer
  const startSessionRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    refreshTimerRef.current = setInterval(refreshSession, SESSION_REFRESH_INTERVAL);
  }, [refreshSession]);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    if (!mountedRef.current) return;

    console.log('Auth state changed:', event);
    debouncedSetLoading(true);

    try {
      if (event === 'SIGNED_OUT' || !session) {
        await clearAuthData();
        setPendingRedirect(null); // Clear any pending redirects
        debouncedSetLoading(false);
        return;
      }

      if (session) {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (error || !currentUser) {
          console.warn('Error getting user:', error);
          await clearAuthData();
          setPendingRedirect(null); // Clear any pending redirects
          debouncedSetLoading(false);
          return;
        }

        if (mountedRef.current) {
          setUser(currentUser);
          startSessionRefresh();
          
          if (event === 'SIGNED_IN') {
            handleSuccessfulLogin();
          }
        }
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      await clearAuthData();
      setPendingRedirect(null); // Clear any pending redirects
    } finally {
      if (mountedRef.current) {
        debouncedSetLoading(false);
      }
    }
  }, [clearAuthData, debouncedSetLoading, handleSuccessfulLogin, startSessionRefresh]);

  // Sign in implementation
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      startLoadingSafetyTimeout();
  
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
  
      if (error) {
        console.error('Sign in error:', error);
        return { data: null, error };
      }
  
      if (!data?.session) {
        console.error('No session returned from auth');
        return {
          data: null,
          error: new Error('No session returned from auth'),
        };
      }

      // Store session in API route and cookies
      try {
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            session: data.session,
            cookieOptions: {
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 30 * 24 * 60 * 60
            }
          }),
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to store session:', errorText);
          return {
            data: null,
            error: new Error('Failed to store session'),
          };
        }
  
        // Set cookies on client side as backup
        if (typeof window !== 'undefined') {
          const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
          if (projectId) {
            document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=lax`;
            document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=lax`;
            document.cookie = `sb-user-id=${data.user?.id}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=lax`;
          }
        }
  
      } catch (error) {
        console.error('Error storing session:', error);
        return {
          data: null,
          error: new Error('Failed to store session'),
        };
      }
  
      // Set session in Supabase client
      try {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      } catch (error) {
        console.error('Error setting client session:', error);
        return {
          data: null,
          error: new Error('Failed to set client session'),
        };
      }
  
      // Update user state and trigger redirect
      setUser(data.user);
      startSessionRefresh();
      handleSuccessfulLogin(); // Trigger redirect
      
      if (mountedRef.current) {
        setLoading(false);
      }
  
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      if (mountedRef.current) {
        setLoading(false);
      }
      return { data: null, error };
    }
  };

  // Sign up implementation
  const signUp = async (
    email: string,
    password: string,
    metadata: Record<string, any>
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      startLoadingSafetyTimeout();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Sign out implementation
  const signOut = async () => {
    try {
      setLoading(true);
      
      // First clear server session
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (serverError) {
        console.warn('Error clearing server session:', serverError);
      }
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all auth data
      await clearAuthData();
      
      // Set loading to false before navigation
      setLoading(false);
      
      // Force clear any Supabase session data
      if (typeof window !== 'undefined') {
        const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
        if (projectId) {
          window.localStorage.removeItem(`sb-${projectId}-auth-token`);
        }
        // Use window.location for a full page reload
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, ensure we clean up
      await clearAuthData();
      setLoading(false);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  // Initialize auth state
  useEffect(() => {
    mountedRef.current = true;
    
    const initializeAuth = async () => {
      if (!mountedRef.current || initialized) return;

      try {
        startLoadingSafetyTimeout();
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          if (mountedRef.current) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          console.warn('Error getting user:', userError);
          if (mountedRef.current) {
            await clearAuthData();
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (mountedRef.current) {
          setUser(currentUser);
          startSessionRefresh();
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mountedRef.current) {
          await clearAuthData();
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
    };
  }, [initialized, clearAuthData, startLoadingSafetyTimeout, startSessionRefresh]);

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
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
