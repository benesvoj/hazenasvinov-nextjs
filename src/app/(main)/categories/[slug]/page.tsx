'use client';

import { useParams } from 'next/navigation';
import { useFetchCategories } from '@/hooks/useFetchCategories';
import { useFetchMatches } from '@/hooks/useFetchMatches';
import { CategoryStandings } from '@/app/(main)/categories/components/CategoryStandings';
import { SeasonalMatches } from '@/app/(main)/categories/components/SeasonalMatches';
import { DebugInfo } from '@/app/(main)/categories/components/DebugInfo';
import { Spinner } from '@heroui/react';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.slug as string;
  
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useFetchCategories();
  const { matches, loading: matchesLoading, error: matchesError, debugInfo } = useFetchMatches(categorySlug);
  
  // Find the current category
  const currentCategory = categories?.find(cat => 
    cat.code === categorySlug
  );
  
  if (categoriesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  if (categoriesError || !currentCategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Kategorie nenalezena
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Požadovaná kategorie nebyla nalezena nebo není dostupná.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {currentCategory.name}
        </h1>
        {currentCategory.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {currentCategory.description}
          </p>
        )}
      </div>
      
      {/* Standings Table */}
      <div className="mb-8">
        <CategoryStandings 
          categoryId={currentCategory.id} 
          categoryName={currentCategory.name}
        />
      </div>
      
      {/* Seasonal Matches */}
      <div>
        <SeasonalMatches 
          categoryId={currentCategory.id}
          categoryName={currentCategory.name}
          matches={matches}
          loading={matchesLoading}
        />
      </div>
      
      {/* Debug Information */}
      {/* <DebugInfo 
        categorySlug={categorySlug}
        debugInfo={debugInfo}
        error={matchesError}
      /> */}
    </div>
  );
}
