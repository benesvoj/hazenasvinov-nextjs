import {createClient} from '@/utils/supabase/client';

import {useUser} from '@/contexts/UserContext';

// Simplified useAuth hook that uses UserContext
export function useAuth() {
  const {user, loading, error, isAuthenticated, refreshUser} = useUser();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // UserContext will automatically update when auth state changes
  };

  return {
    user,
    session: null, // We don't need session data for security
    loading,
    error,
    isAuthenticated,
    refreshUser,
    signOut,
  };
}

// Export the AuthState interface for backward compatibility
export interface AuthState {
  user: any;
  session: any;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
