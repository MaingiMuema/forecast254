/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, AuthError, Session, AuthChangeEvent, WeakPassword } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';

type AuthResponse = {
  data: {
    user: User | null;
    session: Session | null;
    weakPassword?: WeakPassword | null;
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
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for auth configuration
  const AUTH_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    AUTH_TIMEOUT: 5000,
    SESSION_CHECK_INTERVAL: 30000,
  };

  // Function to clear all auth-related data
  const clearAuthData = async () => {
    // Clear state
    setUser(null);

    // Clear all localStorage data
    if (typeof window !== 'undefined') {
      // Clear Supabase specific items
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
      if (projectId) {
        window.localStorage.removeItem(`sb-${projectId}-auth-token`);
        window.localStorage.removeItem('supabase.auth.token');
        window.localStorage.removeItem('supabase.auth.expires');
        window.localStorage.removeItem('supabase.auth.data');
      }
      
      // Clear any other auth-related items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('session')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Clear cookies with multiple domain variations
    const cookies = [
      'sb:token',
      'sb:session',
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      '__session',
      'auth',
      'token'
    ];

    if (typeof window !== 'undefined') {
      const domains = [
        window.location.hostname,
        `.${window.location.hostname}`,
        window.location.hostname.split('.').slice(1).join('.'),
        ''  // Empty string for cookies without domain
      ];

      const paths = ['/', '/api', '', '*'];

      // Function to clear a cookie with all possible combinations
      const clearCookie = (name: string) => {
        domains.forEach(domain => {
          paths.forEach(path => {
            // Clear with domain and path
            if (domain) {
              document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${domain}`;
            }
            // Clear without domain
            document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          });
        });

        // Also try clearing with Secure and SameSite attributes
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=strict`;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; secure; samesite=lax`;
      };

      // Clear all specified cookies
      cookies.forEach(clearCookie);

      // Also clear any existing cookies that match our patterns
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        const trimmedName = name.trim();
        if (
          trimmedName.includes('sb:') ||
          trimmedName.includes('sb-') ||
          trimmedName.includes('supabase') ||
          trimmedName.includes('auth') ||
          trimmedName.includes('token') ||
          trimmedName.includes('session')
        ) {
          clearCookie(trimmedName);
        }
      });
    }

    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }

    // Clear any pending auth operations
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  };

  // Function to handle successful login
  const handleSuccessfulLogin = () => {
    // Check if we should redirect
    const redirectTo = searchParams?.get('redirectTo');
    if (redirectTo) {
      const decodedRedirect = decodeURIComponent(redirectTo);
      router.push(decodedRedirect);
    } else {
      router.push('/');
    }
  };

  // Enhanced session sync with retry logic
  const syncSession = async (retryCount = 0): Promise<boolean> => {
    try {
      // Get current session state
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Session sync error:', error);
        if (retryCount < AUTH_CONFIG.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.RETRY_DELAY));
          return syncSession(retryCount + 1);
        }
        return false;
      }

      if (!session) {
        setUser(null);
        return false;
      }

      // Verify the session is still valid
      const { data: { user: currentUser }, error: refreshError } = await supabase.auth.getUser();
      
      if (refreshError || !currentUser) {
        setUser(null);
        return false;
      }

      setUser(currentUser);
      return true;
    } catch (error) {
      console.error('Session sync error:', error);
      if (retryCount < AUTH_CONFIG.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.RETRY_DELAY));
        return syncSession(retryCount + 1);
      }
      return false;
    }
  };

  // Enhanced auth state change handler
  const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
    console.log('Auth state changed:', event);
    
    // Handle sign out immediately
    if (event === 'SIGNED_OUT') {
      await clearAuthData();
      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
      return;
    }

    // Handle missing access token
    if (!session?.access_token) {
      if (event !== 'INITIAL_SESSION') {
        await clearAuthData();
      }
      return;
    }

    setLoading(true);
    try {
      // First verify the session is valid
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error('Invalid session');
      }

      // Then attempt to sync the session
      const syncPromise = syncSession();
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          clearTimeout(timeoutId);
          reject(new Error('Auth timeout'));
        }, AUTH_CONFIG.AUTH_TIMEOUT);
      });
      
      const syncResult = await Promise.race([
        syncPromise,
        timeoutPromise
      ]).catch(async (error) => {
        console.warn('Initial sync attempt failed:', error);
        // If timeout, try one more time with increased timeout
        if (error.message === 'Auth timeout') {
          return syncSession();
        }
        return false;
      });

      if (syncResult) {
        if (event === 'SIGNED_IN') {
          handleSuccessfulLogin();
        }
      } else {
        // One final session check before clearing
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (!finalSession) {
          await clearAuthData();
          if (pathname !== '/login' && pathname !== '/register') {
            router.push('/login');
          }
        }
      }
    } catch (error) {
      console.error('Error during auth state change:', error);
      await clearAuthData();
      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle sign out
  const signOut = async () => {
    try {
      setLoading(true);
      
      // First attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      // Force session cleanup regardless of signout success
      try {
        await supabase.auth.setSession({
          access_token: '',
          refresh_token: ''
        });
      } catch (sessionError) {
        console.warn('Error clearing session:', sessionError);
      }

      // Clear all client-side data
      await clearAuthData();
      
      // Clear any server-side session data
      try {
        await fetch('/api/auth/session', {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (serverError) {
        console.warn('Error clearing server session:', serverError);
      }

      // If there was an error in the initial signout, throw it
      if (error) throw error;

      // Set loading to false before navigation
      setLoading(false);

      // Use window.location.href for a complete reset of the application state
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, ensure we clean up
      await clearAuthData();
      setLoading(false);
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
      }
    }
  };

  // Function to persist session
  const persistSession = async (session: Session) => {
    try {
      // Store session in API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to persist session');
      }

      return true;
    } catch (error) {
      console.error('Error persisting session:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Initial session error:', error);
          clearAuthData();
          return;
        }

        if (session?.access_token) {
          await handleAuthStateChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up periodic session checks
    const startSessionChecks = () => {
      // Clear any existing interval
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      
      sessionCheckIntervalRef.current = setInterval(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && user) {
          clearAuthData();
          router.push('/login');
        }
      }, AUTH_CONFIG.SESSION_CHECK_INTERVAL);
    };

    initializeAuth();
    startSessionChecks();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: Record<string, any>
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      return { data, error };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
      };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error };
      }

      // Store session in API route
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session: data.session }),
      });

      if (!response.ok) {
        return {
          data: null,
          error: new Error('Failed to store session') as AuthError,
        };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
      };
    }
  };

  const value: AuthContextType = {
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
