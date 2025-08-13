import { useEffect, useState, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  })
  
  // Track if we've already processed the initial session
  const hasProcessedInitialSession = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          // Check if it's a permission error and handle gracefully
          if (error.message.includes('permission denied') || 
              error.message.includes('permission denied for table')) {
            console.log('Permission denied in useAuth - this is normal for unauthenticated users')
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null, // Don't show permission errors to users
              isAuthenticated: false,
            })
            return
          }
          
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: error.message,
            isAuthenticated: false,
          }))
          return
        }

        // Set initial state without logging
        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
          error: null,
          isAuthenticated: !!session?.user,
        })
        
        // Mark that we've processed the initial session
        hasProcessedInitialSession.current = true
        
      } catch (error) {
        // Handle any unexpected errors
        console.error('Unexpected error in useAuth:', error)
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to get session',
          isAuthenticated: false,
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        try {
          // Only log actual sign-in events, not page refreshes with existing sessions
          if (event === 'SIGNED_IN' && session?.user?.email && hasProcessedInitialSession.current) {
            try {
              await fetch('/api/log-login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: session.user.email,
                  status: 'success',
                  action: 'login',
                  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown'
                }),
              });
            } catch (logError) {
              console.error('Failed to log successful login:', logError);
              // Don't block auth state change if logging fails
            }
          }

          setAuthState({
            user: session?.user ?? null,
            session: session,
            loading: false,
            error: null,
            isAuthenticated: !!session?.user,
          })
        } catch (error) {
          console.error('Error in auth state change:', error)
          // Don't update state on error, keep current state
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if signout fails, we should clear local state
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      })
    }
  }

  return {
    ...authState,
    signOut,
  }
}
