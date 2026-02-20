'use client';

import React, {createContext, useContext, useState, useEffect, useCallback, useRef} from 'react';

import {User} from '@supabase/supabase-js';

import {useSupabaseClient} from '@/hooks';
import {UserProfile} from '@/types';

export interface UserContextType {
  // User data
  user: User | null;
  userProfile: UserProfile | null;
  userCategories: string[];

  // Loading states
  loading: boolean;
  profileLoading: boolean;

  // Error states
  error: string | null;
  profileError: string | null;

  // Actions
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const supabase = useSupabaseClient();

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userCategories, setUserCategories] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

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
  }, [supabase.auth]);

  // Fetch user profile
  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      return getCachedData(`profile-${userId}`, async () => {
        const {data, error} = await supabase
          .from('user_profiles')
          .select('*')
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
          role_id: profile.role_id,
          assigned_categories: profile.assigned_categories || [],
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };
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
        // Fetch profile
        const [profile] = await Promise.all([fetchUserProfile(userData.id)]);

        setUserProfile(profile);

        // Extract category from profile
        if (profile) {
          setUserCategories(profile.assigned_categories || []);
        }
      } else {
        // No user authenticated - clear all data
        setUserProfile(null);
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
        setUserCategories([]);
      } else {
        console.error('Error refreshing user:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh user');
        // Clear user data on error
        setUser(null);
        setUserProfile(null);
        setUserCategories([]);
      }
    }
  }, [fetchUser, fetchUserProfile]);

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
      return userProfile?.role === role || false;
    },
    [userProfile]
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
          setUserCategories([]);
        } else {
          console.error('Error initializing user:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize user');
          // Clear user data on initialization error
          setUser(null);
          setUserProfile(null);
          setUserCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };

    void initializeUser();
  }, [refreshUser]); // Only run once on mount

  // No auth state change listener - let Supabase handle session management
  // This prevents unnecessary re-fetches when switching tabs

  const value: UserContextType = {
    // User data
    user,
    userProfile,
    userCategories,

    // Loading states
    loading,
    profileLoading,

    // Error states
    error,
    profileError,

    // Actions
    refreshUser,
    refreshProfile,
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
