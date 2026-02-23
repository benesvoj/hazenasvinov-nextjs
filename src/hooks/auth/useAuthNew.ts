import {useUser} from '@/contexts/UserContext';

import {useSupabaseClient} from '@/hooks';

// Simplified useAuth hook that uses UserContext
export function useAuth() {
  const {user, loading, error, isAuthenticated, refreshUser} = useUser();
  const supabase = useSupabaseClient();

  const signOut = async () => {
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
