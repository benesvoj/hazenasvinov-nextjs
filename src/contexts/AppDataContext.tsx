'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {createClient} from '@/utils/supabase/client';
import {Season, Category, Member, Club} from '@/types';

interface AppDataContextType {
  // Data
  seasons: Season[];
  categories: Category[];
  members: Member[];
  clubs: Club[];

  // Loading states
  loading: boolean;
  seasonsLoading: boolean;
  categoriesLoading: boolean;
  membersLoading: boolean;
  clubsLoading: boolean;

  // Error states
  error: string | null;
  seasonsError: string | null;
  categoriesError: string | null;
  membersError: string | null;
  clubsError: string | null;

  // Actions
  refreshSeasons: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshClubs: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Computed properties
  activeSeason: Season | null;
  sortedSeasons: Season[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

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

export function AppDataProvider({children}: {children: React.ReactNode}) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  const [loading, setLoading] = useState(false);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [clubsLoading, setClubsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [seasonsError, setSeasonsError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [clubsError, setClubsError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const hasInitialized = useRef(false);

  // Fetch seasons
  const fetchSeasons = useCallback(async (): Promise<Season[]> => {
    return getCachedData('seasons', async () => {
      const {data, error} = await supabase
        .from('seasons')
        .select('id, name, start_date, end_date, is_active, is_closed')
        .order('start_date', {ascending: false})
        .limit(50);

      if (error) throw error;
      return data || [];
    });
  }, [supabase]);

  // Fetch categories
  const fetchCategories = useCallback(async (): Promise<Category[]> => {
    return getCachedData('categories', async () => {
      const {data, error} = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    });
  }, [supabase]);

  // Fetch members
  const fetchMembers = useCallback(async (): Promise<Member[]> => {
    return getCachedData('members', async () => {
      const {data, error} = await supabase
        .from('members')
        .select('*')
        .order('surname', {ascending: true})
        .order('name', {ascending: true});

      if (error) throw error;
      return data || [];
    });
  }, [supabase]);

  // Fetch clubs
  const fetchClubs = useCallback(async (): Promise<Club[]> => {
    return getCachedData('clubs', async () => {
      const {data, error} = await supabase
        .from('clubs')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    });
  }, [supabase]);

  // Refresh seasons
  const refreshSeasons = useCallback(async () => {
    try {
      setSeasonsLoading(true);
      setSeasonsError(null);

      // Clear cache
      requestCache.delete('seasons');
      cacheTimestamps.delete('seasons');

      const data = await fetchSeasons();
      setSeasons(data);
    } catch (err) {
      console.error('Error refreshing seasons:', err);
      setSeasonsError(err instanceof Error ? err.message : 'Failed to refresh seasons');
    } finally {
      setSeasonsLoading(false);
    }
  }, [fetchSeasons]);

  // Refresh categories
  const refreshCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      // Clear cache
      requestCache.delete('categories');
      cacheTimestamps.delete('categories');

      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error refreshing categories:', err);
      setCategoriesError(err instanceof Error ? err.message : 'Failed to refresh categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, [fetchCategories]);

  // Refresh members
  const refreshMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      setMembersError(null);

      // Clear cache
      requestCache.delete('members');
      cacheTimestamps.delete('members');

      const data = await fetchMembers();
      setMembers(data);
    } catch (err) {
      console.error('Error refreshing members:', err);
      setMembersError(err instanceof Error ? err.message : 'Failed to refresh members');
    } finally {
      setMembersLoading(false);
    }
  }, [fetchMembers]);

  // Refresh clubs
  const refreshClubs = useCallback(async () => {
    try {
      setClubsLoading(true);
      setClubsError(null);

      // Clear cache
      requestCache.delete('clubs');
      cacheTimestamps.delete('clubs');

      const data = await fetchClubs();
      setClubs(data);
    } catch (err) {
      console.error('Error refreshing clubs:', err);
      setClubsError(err instanceof Error ? err.message : 'Failed to refresh clubs');
    } finally {
      setClubsLoading(false);
    }
  }, [fetchClubs]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear all caches
      requestCache.clear();
      cacheTimestamps.clear();

      // Fetch all data in parallel
      const [seasonsData, categoriesData, membersData, clubsData] = await Promise.all([
        fetchSeasons(),
        fetchCategories(),
        fetchMembers(),
        fetchClubs(),
      ]);

      setSeasons(seasonsData);
      setCategories(categoriesData);
      setMembers(membersData);
      setClubs(clubsData);
    } catch (err) {
      console.error('Error refreshing all data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchSeasons, fetchCategories, fetchMembers, fetchClubs]);

  // Computed properties
  const activeSeason = useMemo(() => {
    return seasons.find((season) => season.is_active) || null;
  }, [seasons]);

  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
  }, [seasons]);

  // Initial load - only run once
  useEffect(() => {
    const initializeData = async () => {
      if (hasInitialized.current) {
        return;
      }

      try {
        setLoading(true);
        await refreshAll();
        hasInitialized.current = true;
      } catch (err) {
        console.error('Error initializing app data:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [refreshAll]); // Only run once on mount

  const value: AppDataContextType = {
    // Data
    seasons,
    categories,
    members,
    clubs,

    // Loading states
    loading,
    seasonsLoading,
    categoriesLoading,
    membersLoading,
    clubsLoading,

    // Error states
    error,
    seasonsError,
    categoriesError,
    membersError,
    clubsError,

    // Actions
    refreshSeasons,
    refreshCategories,
    refreshMembers,
    refreshClubs,
    refreshAll,

    // Computed properties
    activeSeason,
    sortedSeasons,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// Custom hook to use app data context
export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
