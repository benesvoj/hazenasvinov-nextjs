'use client';

/**
 * Performance-optimized MatchSchedule component with memoization
 */

import React, {memo, useMemo} from 'react';

import {PerformanceMonitorPanel} from '@/components/features/admin/PerformanceMonitorPanel';

import CategoryMatchesAndResults from '@/app/(main)/components/CategoryMatchesAndResults';

import {
  useOptimizedOwnClubMatches,
  useFetchCategories,
  useFetchSeasons,
  useSeasonFiltering,
} from '@/hooks';

interface OptimizedMatchScheduleProps {
  className?: string;
}

const OptimizedMatchSchedule = memo<OptimizedMatchScheduleProps>(({className}) => {
  const {
    data: availableCategories,
    loading: categoriesLoading,
    refetch: fetchCategories,
  } = useFetchCategories();
  const {data: seasons, loading: seasonLoading} = useFetchSeasons();
  const {activeSeason} = useSeasonFiltering({seasons: seasons || []});

  // For now, we'll use the first category as selected (you can add category selection logic later)
  const selectedCategoryData = availableCategories[0];

  // Fetch data on mount
  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Memoized category and season IDs to prevent unnecessary re-renders
  const categoryId = useMemo(() => selectedCategoryData?.id, [selectedCategoryData?.id]);
  const seasonId = useMemo(() => activeSeason?.id, [activeSeason?.id]);

  // Use optimized hook for match data
  const {
    allMatches,
    upcomingMatches,
    recentResults,
    loading: matchesLoading,
    error: matchesError,
  } = useOptimizedOwnClubMatches(categoryId, seasonId, {
    includeTeamDetails: true,
  });

  // Memoized loading state
  const isLoading = useMemo(
    () => categoriesLoading || seasonLoading || matchesLoading,
    [categoriesLoading, seasonLoading, matchesLoading]
  );

  // Memoized error state
  const error = useMemo(() => matchesError || null, [matchesError]);

  // Memoized category data for display
  const categoryDisplayData = useMemo(
    () => ({
      selectedCategoryData,
      availableCategories,
      activeSeason,
    }),
    [selectedCategoryData, availableCategories, activeSeason]
  );

  // Memoized match data for display
  const matchDisplayData = useMemo(
    () => ({
      allMatches,
      upcomingMatches,
      recentResults,
    }),
    [allMatches, upcomingMatches, recentResults]
  );

  // Don't render if essential data is not available
  if (!selectedCategoryData || !activeSeason) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Načítání dat...</p>
          </div>
        </div>
        <PerformanceMonitorPanel />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Chyba při načítání zápasů</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        <PerformanceMonitorPanel />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Načítání zápasů...</p>
          </div>
        </div>
        <PerformanceMonitorPanel />
      </div>
    );
  }

  return (
    <div className={className}>
      <CategoryMatchesAndResults
        loading={isLoading}
        allMatches={matchDisplayData.allMatches}
        upcomingMatches={matchDisplayData.upcomingMatches}
        recentResults={matchDisplayData.recentResults}
        selectedCategory={categoryDisplayData.selectedCategoryData?.id || ''}
        redirectionLinks={true}
      />
      <PerformanceMonitorPanel />
    </div>
  );
});

OptimizedMatchSchedule.displayName = 'OptimizedMatchSchedule';

export default OptimizedMatchSchedule;
