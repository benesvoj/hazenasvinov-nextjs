'use client';

import {Alert, Skeleton, Tab, Tabs} from '@heroui/react';

import {translations} from '@/lib/translations';

import {hasItems, isEmpty} from '@/utils/arrayHelper';

import CategoryMatchesAndResults from '@/app/(main)/components/CategoryMatchesAndResults';

import {Heading, LoadingSpinner, UnifiedStandingTable} from '@/components';

import {useMatchScheduleData} from './hooks/useMatchScheduleData';

interface MatchScheduleProps {
  title?: string;
  description?: string;
  redirectionLinks?: boolean;
  /** When provided, overrides internal category selection and hides the category tabs. */
  selectedCategoryId?: string;
  onStartResultFlow?: (match: any) => void;
  showResultButton?: boolean;
}

export default function MatchSchedule({
  title,
  description,
  redirectionLinks = true,
  selectedCategoryId,
  onStartResultFlow,
  showResultButton = false,
}: MatchScheduleProps) {
  const {
    selectedCategory,
    setSelectedCategory,
    categories,
    selectedCategoryData,
    activeSeason,
    allMatches,
    upcomingMatches,
    recentResults,
    matchesLoading,
    matchesError,
    categoryStandings,
    standingsLoading,
    standingsError,
    refereesByMatchId,
  } = useMatchScheduleData({selectedCategoryId});

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
            <LoadingSpinner label={translations.common.loading} />
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
          {isEmpty(allMatches) && !matchesLoading && !matchesError && (
            <Skeleton className="w-full h-full" />
          )}
        </div>

        {!selectedCategoryId && hasItems(categories) && (
          <Tabs
            selectedKey={selectedCategory}
            onSelectionChange={(key) => setSelectedCategory(key as string)}
            className="w-full mb-2 md:mb-4"
            color="primary"
            variant="underlined"
          >
            {categories.map((category) => (
              <Tab key={category.id} title={category.name} />
            ))}
          </Tabs>
        )}

        {!selectedCategoryId && !hasItems(categories) && (
          <div className="text-center py-8 mb-8">
            <p className="text-gray-600">Žádné kategorie nejsou k dispozici</p>
          </div>
        )}

        {hasItems(categories) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CategoryMatchesAndResults
              loading={matchesLoading}
              selectedCategory={selectedCategory}
              allMatches={allMatches}
              upcomingMatches={upcomingMatches}
              recentResults={recentResults}
              redirectionLinks={redirectionLinks}
              onStartResultFlow={onStartResultFlow}
              showResultButton={showResultButton}
              refereesByMatchId={refereesByMatchId}
            />
            <UnifiedStandingTable standings={categoryStandings} loading={standingsLoading} />
          </div>
        )}
      </div>
    </section>
  );
}
