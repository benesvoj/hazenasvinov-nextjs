import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {hasItems, isEmpty} from '@/utils/arrayHelper';

import {useAppData, useUser} from '@/contexts';
import {Category, Season} from '@/types';

interface CoachCategoryContextType {
  /** Categories the current coach is allowed to see (filtered by assignment, or all for admins). */
  availableCategories: Category[];

  /** Currently selected category ID. Empty string until resolved. */
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;

  /** All seasons from AppDataContext (sorted, newest first). */
  availableSeasons: Season[];

  /** Currently selected season ID. Auto-initialized to the active season. */
  selectedSeason: string;
  setSelectedSeason: (id: string) => void;

  /** The active season object (convenience). */
  activeSeason: Season | null;

  /** True while assigned categories or initial data are being resolved. */
  isLoading: boolean;

  /** Whether the current user has admin role (sees all categories). */
  isAdmin: boolean;
}

const CoachCategoryContext = createContext<CoachCategoryContextType | null>(null);

interface CoachCategoryProviderProps {
  children: ReactNode;
}

export function CoachCategoryProvider({children}: CoachCategoryProviderProps) {
  const {userCategories, isAdmin} = useUser();
  const {
    categories: {data: allCategories, loading: categoriesLoading},
    seasons: {data: allSeasons, loading: seasonsLoading, activeSeason},
  } = useAppData();

  const [userSelectedCategory, setUserSelectedCategory] = useState<string>('');
  const [userSelectedSeason, setUserSelectedSeason] = useState<string>('');

  const resolvedAssigned = useMemo<string[]>(() => {
    if (typeof window === 'undefined') return [];

    if (isAdmin) {
      const simulationData = localStorage.getItem('adminCategorySimulation');
      if (simulationData) {
        try {
          const {selectedCategories} = JSON.parse(simulationData);
          if (Array.isArray(selectedCategories) && hasItems(selectedCategories)) {
            return selectedCategories as string[];
          }
        } catch {
          // Ignore JSON parsing errors and fallback to all categories
        }
      }
      return []; // Admin without simulation → empty means "all categories"
    }
    return userCategories;
  }, [isAdmin, userCategories]);

  const assignedResolved = !categoriesLoading;

  const availableCategories = useMemo<Category[]>(() => {
    if (categoriesLoading) return [];

    if (isAdmin && isEmpty(resolvedAssigned)) {
      return allCategories;
    }

    return resolvedAssigned
      .map((id) => allCategories.find((cat) => cat.id === id))
      .filter((c): c is Category => c != null);
  }, [categoriesLoading, allCategories, isAdmin, resolvedAssigned]);

  const selectedCategory = useMemo(() => {
    if (userSelectedCategory && availableCategories.some((c) => c.id === userSelectedCategory)) {
      return userSelectedCategory;
    }
    return availableCategories[0]?.id ?? '';
  }, [userSelectedCategory, availableCategories]);

  const availableSeasons = useMemo(() => {
    return [...allSeasons].sort((a, b) => {
      if (!a.start_date) return 1;
      if (!b.start_date) return -1;
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    });
  }, [allSeasons]);

  const selectedSeason = useMemo(() => {
    if (userSelectedSeason) return userSelectedSeason;
    return activeSeason?.id ?? '';
  }, [userSelectedSeason, activeSeason]);

  const isLoading = categoriesLoading || seasonsLoading || !assignedResolved;

  const stableSetCategory = useCallback((id: string) => {
    setUserSelectedCategory(id);
  }, []);

  const stableSetSeason = useCallback((id: string) => {
    setUserSelectedSeason(id);
  }, []);

  const value = useMemo<CoachCategoryContextType>(
    () => ({
      availableCategories,
      selectedCategory,
      setSelectedCategory: stableSetCategory,
      availableSeasons,
      selectedSeason,
      setSelectedSeason: stableSetSeason,
      activeSeason,
      isLoading,
      isAdmin,
    }),
    [
      availableCategories,
      selectedCategory,
      stableSetCategory,
      availableSeasons,
      selectedSeason,
      stableSetSeason,
      activeSeason,
      isLoading,
      isAdmin,
    ]
  );

  return <CoachCategoryContext.Provider value={value}>{children}</CoachCategoryContext.Provider>;
}

export function useCoachCategory(): CoachCategoryContextType {
  const ctx = useContext(CoachCategoryContext);

  if (!ctx) {
    throw new Error('useCoachCategory must be used within the context');
  }
  return ctx;
}
