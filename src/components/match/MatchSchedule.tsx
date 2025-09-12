'use client';

import React, {useState, useEffect, useRef, useMemo} from 'react';
import {Tabs, Tab} from '@heroui/tabs';
import {translations} from '@/lib/translations';
import {
  useSeasons,
  useCategories,
  useStandings,
  useUserRoles,
  useOptimizedOwnClubMatches,
} from '@/hooks';
import CategoryStandingsTable from '@/app/(main)/components/CategoryStandingsTable';
import CategoryMatchesAndResults from '@/app/(main)/components/CategoryMatchesAndResults';
import {Skeleton} from '@heroui/skeleton';
import LoadingSpinner from '../LoadingSpinner';
import {Alert} from '@heroui/react';
import {Heading} from '@/components';
interface MatchScheduleProps {
  title?: string;
  description?: string;
  showOnlyAssignedCategories?: boolean; // New prop to control category filtering
  redirectionLinks?: boolean;
}

export default function MatchSchedule({
  title,
  description,
  showOnlyAssignedCategories = false,
  redirectionLinks = true,
}: MatchScheduleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [assignedCategoryIds, setAssignedCategoryIds] = useState<string[]>([]);
  const lastFetchedRef = useRef<{categoryId: string; seasonId: string} | null>(null);

  const {activeSeason, fetchActiveSeason} = useSeasons();
  const {categories, fetchCategories} = useCategories();

  // Try to get user roles, but handle case where UserProvider is not available
  let getCurrentUserCategories: (() => Promise<string[]>) | null = null;
  try {
    const userRoles = useUserRoles();
    getCurrentUserCategories = userRoles.getCurrentUserCategories;
  } catch (error) {
    // UserProvider not available (e.g., on public pages)
  }

  // Filter categories based on the prop
  const availableCategories = showOnlyAssignedCategories
    ? categories.filter((cat) => assignedCategoryIds.includes(cat.id))
    : categories;

  // Get the selected category data from available categories
  const selectedCategoryData = availableCategories.find((cat) => cat.id === selectedCategory);

  // Only call the hook when we have valid data
  const {
    allMatches,
    loading: matchesLoading,
    error: matchesError,
  } = useOptimizedOwnClubMatches(
    selectedCategoryData?.id || undefined,
    activeSeason?.id || undefined
  );

  // Use the standings hook
  const {
    standings,
    loading: standingsLoading,
    error: standingsError,
    fetchStandings,
  } = useStandings();
  const [fetchedCategoryId, setFetchedCategoryId] = useState<string | null>(null);

  // Fetch active season and categories on mount
  useEffect(() => {
    fetchActiveSeason();
    fetchCategories();
  }, [fetchActiveSeason, fetchCategories]);

  // Fetch assigned categories if needed for coach portal
  useEffect(() => {
    if (showOnlyAssignedCategories && getCurrentUserCategories) {
      const fetchAssignedCategories = async () => {
        try {
          const categories = await getCurrentUserCategories();
          setAssignedCategoryIds(categories);
        } catch (error) {
          console.error('Error fetching assigned categories:', error);
          setAssignedCategoryIds([]);
        }
      };
      fetchAssignedCategories();
    } else if (showOnlyAssignedCategories && !getCurrentUserCategories) {
      // If UserProvider is not available, use all categories
      setAssignedCategoryIds(categories.map((cat) => cat.id));
    }
  }, [showOnlyAssignedCategories, getCurrentUserCategories, categories]);

  // Update selected category when available categories change
  useEffect(() => {
    if (availableCategories.length > 0) {
      // If no category is selected or current selected category is not available, select the first available one
      if (!selectedCategory || !availableCategories.some((cat) => cat.id === selectedCategory)) {
        setSelectedCategory(availableCategories[0].id);
      }
    }
  }, [availableCategories, selectedCategory]);

  // Fetch standings when category or active season changes
  useEffect(() => {
    if (availableCategories.length > 0 && activeSeason && selectedCategoryData) {
      const categoryId = selectedCategoryData.id;
      const seasonId = activeSeason.id;

      // Check if we've already fetched for this combination
      const lastFetched = lastFetchedRef.current;
      if (
        lastFetched &&
        lastFetched.categoryId === categoryId &&
        lastFetched.seasonId === seasonId
      ) {
        return; // Already fetched for this combination
      }

      // Update the ref and fetch
      lastFetchedRef.current = {categoryId, seasonId};
      setFetchedCategoryId(categoryId);
      fetchStandings(categoryId, seasonId);
    }
  }, [
    selectedCategory,
    activeSeason?.id,
    selectedCategoryData?.id,
    activeSeason,
    availableCategories.length,
    fetchStandings,
    selectedCategoryData,
  ]);

  // allMatches is already provided by the hook

  const upcomingMatches = useMemo(() => {
    return allMatches.filter((match) => match.status === 'upcoming').slice(0, 3);
  }, [allMatches]);

  const recentResults = useMemo(() => {
    return allMatches
      .filter((match) => match.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [allMatches]);

  // Filter standings by selected category - only show standings for the category we actually fetched
  const categoryStandings = useMemo(() => {
    if (!selectedCategoryData?.id || !fetchedCategoryId) return [];

    // Only show standings if we fetched them for this specific category
    if (fetchedCategoryId !== selectedCategoryData.id) return [];

    return standings.filter((standing) => standing.category_id === selectedCategoryData.id);
  }, [standings, selectedCategoryData?.id, fetchedCategoryId]);

  const loading = matchesLoading || standingsLoading;

  // Don't render if we don't have the necessary data
  if (!selectedCategoryData || !activeSeason) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl">
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
            )}
            {description && (
              <p className="text-lg text-gray-600 dark:text-gray-400">{description}</p>
            )}
            <LoadingSpinner label={translations.loading} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl">
        <div className="text-center mb-2">
          {title && <Heading size={1}>{title}</Heading>}
          {description && <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>}

          {matchesError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <Alert color="danger" title={`Chyba při načítání zápasů: ${matchesError}`} />
            </div>
          )}
          {standingsError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-700 dark:text-red-300">
                Chyba při načítání tabulky: {standingsError}
              </p>
            </div>
          )}
          {allMatches.length === 0 && !loading && !matchesError && (
            <Skeleton className="w-full h-full" />
          )}
        </div>

        {/* Category Tabs */}
        {availableCategories.length > 0 ? (
          <Tabs
            selectedKey={selectedCategory}
            onSelectionChange={(key) => setSelectedCategory(key as string)}
            className="w-full mb-2 md:mb-4"
            color="primary"
            variant="underlined"
          >
            {availableCategories.map((category) => (
              <Tab key={category.id} title={category.name} />
            ))}
          </Tabs>
        ) : showOnlyAssignedCategories ? (
          <div className="text-center py-8 mb-8">
            <p className="text-gray-600 mb-2">Nemáte přiřazené žádné kategorie</p>
            <p className="text-sm text-gray-500">
              Pro testování trenérského portálu použijte simulaci kategorií v administraci
            </p>
          </div>
        ) : (
          <div className="text-center py-8 mb-8">
            <p className="text-gray-600">Žádné kategorie nejsou k dispozici</p>
          </div>
        )}

        {/* Content */}
        {availableCategories.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Matches and Results */}
            <CategoryMatchesAndResults
              loading={matchesLoading}
              selectedCategory={selectedCategory}
              allMatches={allMatches}
              upcomingMatches={upcomingMatches}
              recentResults={recentResults}
              redirectionLinks={redirectionLinks}
            />

            {/* Right Column - Standings */}
            <CategoryStandingsTable
              standings={categoryStandings}
              standingsLoading={standingsLoading}
            />
          </div>
        )}
      </div>
    </section>
  );
}
