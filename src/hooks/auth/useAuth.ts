'use client';

import {useEffect, useRef, useState} from 'react';

import {Session, User} from '@supabase/supabase-js';

import {showToast} from '@/components';
import {useSupabaseClient} from '@/hooks';

// Global flag to prevent multiple login logs for the same session
let globalLoginLogged = false;
let globalLoginTimeout: NodeJS.Timeout | null = null;

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const INITiAL_AUTH_STATE: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(INITiAL_AUTH_STATE);
  const supabase = useSupabaseClient();

  // Track if we've already processed the initial session
  const hasProcessedInitialSession = useRef(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: {user},
          error,
        } = await supabase.auth.getUser();

        if (error) {
          setAuthState((prev) => ({
            ...prev,
            loading: false,
            error: error.message,
            isAuthenticated: false,
          }));
          return;
        }

        // Set initial state without logging
        setAuthState({
          user: user ?? null,
          session: null, // We don't need session data for security
          loading: false,
          error: null,
          isAuthenticated: !!user,
        });

        // Mark that we've processed the initial session
        hasProcessedInitialSession.current = true;
      } catch (error) {
        // Handle any unexpected errors
        showToast.danger(`Unexpected error in useAuth: ${error}`);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to get user',
          isAuthenticated: false,
        }));
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      try {
        const user = session?.user;

        // Only log actual sign-in events, not page refreshes with existing sessions
        if (event === 'SIGNED_IN' && user?.email && hasProcessedInitialSession.current) {
          // Only log in production environments
          const isProduction = process.env.NODE_ENV === 'production';
          const isLocalhost =
            typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

          if (isProduction && !isLocalhost) {
            // Use global flag to prevent multiple login logs across hook instances
            if (globalLoginLogged) {
              // showToast.warning(`[AUTH] Login already logged globally for ${user.email}, skipping`);
              return;
            }

            // Set global flag and clear it after 10 seconds
            globalLoginLogged = true;
            if (globalLoginTimeout) {
              clearTimeout(globalLoginTimeout);
            }
            globalLoginTimeout = setTimeout(() => {
              globalLoginLogged = false;
            }, 10000);

            // showToast.warning(`[AUTH] Logging login for ${user.email}`);

            // Log login attempt in background without blocking auth state change
            // Use a timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            fetch('/api/log-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                status: 'success',
                action: 'login',
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
              }),
              signal: controller.signal,
            })
              .then(() => {
                clearTimeout(timeoutId);
                // showToast.success(`[AUTH] Login logged successfully for ${user.email}`);
              })
              .catch((logError) => {
                clearTimeout(timeoutId);
              });
          } else {
            // Development mode - no logging needed
          }
        }

        setAuthState({
          user: user ?? null,
          session: null, // We don't store session data for security
          loading: false,
          error: null,
          isAuthenticated: !!user,
        });
      } catch (error) {
        showToast.danger(`Error in auth state change: ${error}`);
        // Don't update state on error, keep current state
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      showToast.danger(`Error signing out: ${error}`);
      // Even if signout fails, we should clear local state
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    }
  };

  return {
    ...authState,
    signOut,
  };
}
