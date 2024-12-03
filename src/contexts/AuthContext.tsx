/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Profile['role'];

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
  role: UserRole | null;
  signUp: (email: string, password: string, metadata: Record<string, any>) => Promise<AuthResponse>;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isValidator: () => boolean;
  isUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(() => {
    // Initialize role from localStorage if available
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole') as UserRole;
      return storedRole || null;
    }
    return null;
  });
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

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
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

  // Clear auth data without automatic redirect
  const clearAuthData = useCallback(async () => {
    if (!mountedRef.current) return;

    setUser(null);
    setRole(null);
    
    if (typeof window === 'undefined') return;

    // Clear all auth-related items from localStorage
    localStorage.removeItem('userRole');
    localStorage.removeItem('sb-auth-token');
    
    // Clear Supabase specific items
    const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    if (projectId) {
      localStorage.removeItem(`sb-${projectId}-auth-token`);
    }

    // Clear cookies
    document.cookie = 'sb-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `sb-${projectId}-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

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

  // Check and sync storage
  const checkAndSyncStorage = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
    if (!projectId) return;

    // Check cookie existence
    const hasCookie = document.cookie.includes('sb-auth-token');
    const hasLocalStorage = !!localStorage.getItem(`sb-${projectId}-auth-token`);

    // If cookie is missing but localStorage exists, clear localStorage
    if (!hasCookie && hasLocalStorage) {
      console.log('Cookie missing, clearing localStorage');
      await clearAuthData();
      return;
    }

    // If localStorage is missing but cookie exists, verify with server
    if (hasCookie && !hasLocalStorage) {
      const isValid = await refreshSession();
      if (!isValid) {
        console.log('Invalid session, clearing all auth data');
        await clearAuthData();
      }
    }
  }, [clearAuthData, refreshSession]);

  // Add storage event listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
      if (!projectId) return;

      // Check if the change is related to auth
      if (e.key === `sb-${projectId}-auth-token` || e.key === 'userRole') {
        checkAndSyncStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAndSyncStorage]);

  // Periodically check storage sync
  useEffect(() => {
    const syncInterval = setInterval(checkAndSyncStorage, 60000); // Check every minute
    return () => clearInterval(syncInterval);
  }, [checkAndSyncStorage]);

  // Initial storage check
  useEffect(() => {
    checkAndSyncStorage();
  }, [checkAndSyncStorage]);

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

  // Fetch user role from profiles table
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      console.log('Fetching role for user:', userId);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching role:', error);
        return null;
      }
      
      if (profile && profile.role) {
        console.log('Fetched role:', profile.role);
        return profile.role as UserRole;
      }
      
      console.log('No profile found or no role set, using default role: user');
      return 'user' as UserRole;
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      return null;
    }
  }, []);

  // Handle role updates
  const updateUserRole = useCallback(async (userId: string) => {
    const newRole = await fetchUserRole(userId);
    if (newRole) {
      setRole(newRole);
      localStorage.setItem('userRole', newRole);
    }
  }, [fetchUserRole]);

  useEffect(() => {
    const initializeAuth = async () => {
      if (initialized) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await updateUserRole(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [initialized, updateUserRole]);

  useEffect(() => {
    if (!initialized) return;

    if (user) {
      updateUserRole(user.id);
    } else {
      setRole(null);
      localStorage.removeItem('userRole');
    }
  }, [user, initialized, updateUserRole]);

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
      
      // Force clear any remaining auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-auth-token');
        localStorage.removeItem('userRole');
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

  const isAdmin = useCallback(() => role === 'admin', [role]);
  const isValidator = useCallback(() => role === 'validator', [role]);
  const isUser = useCallback(() => role === 'user', [role]);

  const value = {
    user,
    loading,
    role,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isValidator,
    isUser,
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
