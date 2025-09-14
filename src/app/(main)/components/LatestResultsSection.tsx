'use client';

import {translations} from '@/lib/translations';
import {MatchResultCard} from './';
import {LoadingSpinner} from '@/components';
import {useAllCategoriesMatches} from '@/hooks/useAllCategoriesMatches';

export default function LatestResultsSection() {
  const {matches: latestMatches, loading, error} = useAllCategoriesMatches();

  if (loading) {
    return (
      <section className="py-8">
        <div className="text-center mb-6">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  if (error || latestMatches.length === 0) {
    return <></>;
  }

  return (
    <section className="py-8">
      {/* Horizontal scrolling container */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide px-4 sm:p-2">
        {latestMatches.map((match) => (
          <MatchResultCard
            key={match.id}
            match={match}
            categoryName={match.category?.name || 'Neznámá kategorie'}
          />
        ))}
      </div>
    </section>
  );
}
