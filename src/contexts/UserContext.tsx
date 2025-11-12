'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import {User} from '@supabase/supabase-js';

import {createClient} from '@/utils/supabase/client';

// Types for user data
export interface UserProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'coach' | 'head_coach' | 'member';
  assigned_categories: string[];
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface UserContextType {
  // User data
  user: User | null;
  userProfile: UserProfile | null;
  userRoles: UserRole[];
  userCategories: string[];

  // Loading states
  loading: boolean;
  profileLoading: boolean;
  rolesLoading: boolean;

  // Error states
  error: string | null;
  profileError: string | null;
  rolesError: string | null;

  // Actions
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshAll: () => Promise<void>;
  getCurrentUserCategories: () => Promise<string[]>;

  // Computed properties
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  hasRole: (role: string) => boolean;
  hasCategory: (categoryId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Request deduplication
const requestCache = new Map<string, Promise<any>>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

// Helper function to check if cache is valid
const isCacheValid = (key: string): boolean => {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to get cached data or fetch new
const getCachedData = async <T,>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
  // Check if we have valid cached data
  if (isCacheValid(key)) {
    const cached = requestCache.get(key);
    if (cached) return cached;
  }

  // Check if request is already in progress
  if (requestCache.has(key)) {
    return requestCache.get(key)!;
  }

  // Create new request
  const request = fetchFn()
    .then((data) => {
      // Cache the result
      requestCache.set(key, Promise.resolve(data));
      cacheTimestamps.set(key, Date.now());
      return data;
    })
    .catch((error) => {
      // Remove failed request from cache
      requestCache.delete(key);
      throw error;
    });

  // Cache the promise
  requestCache.set(key, request);
  return request;
};

export function UserProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userCategories, setUserCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const hasProcessedInitialSession = useRef(false);

  // Fetch user data
  const fetchUser = useCallback(async (): Promise<User | null> => {
    return getCachedData('user', async () => {
      try {
        // First check if there's a session to avoid AuthSessionMissingError
        const {
          data: {session},
        } = await supabase.auth.getSession();
        if (!session) {
          return null;
        }

        const {
          data: {user},
          error,
        } = await supabase.auth.getUser();
        if (error) {
          // Don't throw error for unauthenticated users, just return null
          if (
            error.message.includes('permission denied') ||
            error.message.includes('not authenticated') ||
            error.message.includes('AuthSessionMissingError') ||
            error.message.includes('session_not_found')
          ) {
            return null;
          }
          throw error;
        }
        return user;
      } catch (err) {
        // Catch any other errors and return null for unauthenticated users
        if (
          err instanceof Error &&
          (err.message.includes('AuthSessionMissingError') ||
            err.message.includes('session_not_found') ||
            err.message.includes('not authenticated') ||
            err.name === 'AuthSessionMissingError')
        ) {
          return null;
        }
        // Also check for the specific error type
        if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          err.name === 'AuthSessionMissingError'
        ) {
          return null;
        }
        throw err;
      }
    });
  }, [supabase]);

  // Fetch user profile
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      return getCachedData(`profile-${userId}`, async () => {
        const {data, error} = await supabase
          .from('user_profiles')
          .select(
            `
          id,
          user_id,
          role,
          assigned_categories
        `
          )
          .eq('user_id', userId)
          .order('created_at', {ascending: false});

        if (error) throw error;

        if (!data || data.length === 0) return null;

        // Find coach profile first, fallback to first profile
        let profile = data.find((p: any) => p.role === 'coach' || p.role === 'head_coach');
        if (!profile) profile = data[0];

        return {
          id: profile.id,
          user_id: profile.user_id,
          role: profile.role,
          assigned_categories: profile.assigned_categories || [],
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };
      });
    },
    [supabase]
  );

  // Fetch user roles (legacy system)
  const fetchUserRoles = useCallback(
    async (userId: string): Promise<UserRole[]> => {
      return getCachedData(`roles-${userId}`, async () => {
        const {data, error} = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', {ascending: false});

        if (error) throw error;
        return data || [];
      });
    },
    [supabase]
  );

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const userData = await fetchUser();
      setUser(userData);

      if (userData) {
        // Fetch profile and roles in parallel
        const [profile, roles] = await Promise.all([
          fetchUserProfile(userData.id),
          fetchUserRoles(userData.id),
        ]);

        setUserProfile(profile);
        setUserRoles(roles);

        // Extract category from profile
        if (profile) {
          setUserCategories(profile.assigned_categories || []);
        }
      } else {
        // No user authenticated - clear all data
        setUserProfile(null);
        setUserRoles([]);
        setUserCategories([]);
      }
    } catch (err) {
      // Only log errors that are not related to missing sessions
      if (
        err instanceof Error &&
        (err.message.includes('AuthSessionMissingError') ||
          err.message.includes('session_not_found') ||
          err.message.includes('not authenticated') ||
          err.name === 'AuthSessionMissingError')
      ) {
        // This is expected for unauthenticated users, don't log as error
        setUser(null);
        setUserProfile(null);
        setUserRoles([]);
        setUserCategories([]);
      } else if (
        err &&
        typeof err === 'object' &&
        'name' in err &&
        err.name === 'AuthSessionMissingError'
      ) {
        // This is expected for unauthenticated users, don't log as error
        setUser(null);
        setUserProfile(null);
        setUserRoles([]);
        setUserCategories([]);
      } else {
        console.error('Error refreshing user:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh user');
        // Clear user data on error
        setUser(null);
        setUserProfile(null);
        setUserRoles([]);
        setUserCategories([]);
      }
    }
  }, [fetchUser, fetchUserProfile, fetchUserRoles]);

  // Refresh profile only
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      setProfileLoading(true);
      setProfileError(null);

      // Clear cache for this user's profile
      requestCache.delete(`profile-${user.id}`);
      cacheTimestamps.delete(`profile-${user.id}`);

      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);

      if (profile) {
        setUserCategories(profile.assigned_categories || []);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to refresh profile');
    } finally {
      setProfileLoading(false);
    }
  }, [user, fetchUserProfile]);

  // Refresh roles only
  const refreshRoles = useCallback(async () => {
    if (!user) return;

    try {
      setRolesLoading(true);
      setRolesError(null);

      // Clear cache for this user's roles
      requestCache.delete(`roles-${user.id}`);
      cacheTimestamps.delete(`roles-${user.id}`);

      const roles = await fetchUserRoles(user.id);
      setUserRoles(roles);
    } catch (err) {
      console.error('Error refreshing roles:', err);
      setRolesError(err instanceof Error ? err.message : 'Failed to refresh roles');
    } finally {
      setRolesLoading(false);
    }
  }, [user, fetchUserRoles]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    // Clear all caches
    requestCache.clear();
    cacheTimestamps.clear();

    await refreshUser();
  }, [refreshUser]);

  // Computed properties
  const isAuthenticated = !!user;
  const isAdmin = userProfile?.role === 'admin';
  const isCoach = userProfile?.role === 'coach' || userProfile?.role === 'head_coach';

  const hasRole = useCallback(
    (role: string): boolean => {
      if (userProfile?.role === role) return true;
      return userRoles.some((r) => r.role === role);
    },
    [userProfile, userRoles]
  );

  const hasCategory = useCallback(
    (categoryId: string): boolean => {
      return userCategories.includes(categoryId);
    },
    [userCategories]
  );

  // Get current user's assigned category (for coaches)
  const getCurrentUserCategories = useCallback(async (): Promise<string[]> => {
    try {
      if (!user) return [];

      // Check if we're in admin category testing mode
      if (typeof window !== 'undefined') {
        const simulationData = localStorage.getItem('adminCategorySimulation');
        if (simulationData) {
          try {
            const {selectedCategories} = JSON.parse(simulationData);
            if (selectedCategories && selectedCategories.length > 0) {
              return selectedCategories;
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }

      // Return category from UserContext
      return userCategories;
    } catch (err) {
      console.error('Error fetching current user category:', err);
      return [];
    }
  }, [user, userCategories]);

  // Initial load - only run once
  useEffect(() => {
    const initializeUser = async () => {
      if (hasProcessedInitialSession.current) {
        return;
      }

      try {
        setLoading(true);
        await refreshUser();
        hasProcessedInitialSession.current = true;
      } catch (err) {
        // Only log errors that are not related to missing sessions
        if (
          err instanceof Error &&
          (err.message.includes('AuthSessionMissingError') ||
            err.message.includes('session_not_found') ||
            err.message.includes('not authenticated') ||
            err.name === 'AuthSessionMissingError')
        ) {
          // This is expected for unauthenticated users, don't log as error
          setUser(null);
          setUserProfile(null);
          setUserRoles([]);
          setUserCategories([]);
        } else if (
          err &&
          typeof err === 'object' &&
          'name' in err &&
          err.name === 'AuthSessionMissingError'
        ) {
          // This is expected for unauthenticated users, don't log as error
          setUser(null);
          setUserProfile(null);
          setUserRoles([]);
          setUserCategories([]);
        } else {
          console.error('Error initializing user:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize user');
          // Clear user data on initialization error
          setUser(null);
          setUserProfile(null);
          setUserRoles([]);
          setUserCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []); // Only run once on mount

  // No auth state change listener - let Supabase handle session management
  // This prevents unnecessary re-fetches when switching tabs

  const value: UserContextType = {
    // User data
    user,
    userProfile,
    userRoles,
    userCategories,

    // Loading states
    loading,
    profileLoading,
    rolesLoading,

    // Error states
    error,
    profileError,
    rolesError,

    // Actions
    refreshUser,
    refreshProfile,
    refreshRoles,
    refreshAll,
    getCurrentUserCategories,

    // Computed properties
    isAuthenticated,
    isAdmin,
    isCoach,
    hasRole,
    hasCategory,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Custom hook to use user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Helper hook for backward compatibility
export function useUserData() {
  const {user, userProfile, userCategories, loading, error} = useUser();
  return {
    user,
    userProfile,
    userCategories,
    loading,
    error,
  };
}
