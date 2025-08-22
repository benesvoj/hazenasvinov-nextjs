'use client';

import { useParams } from 'next/navigation';
import { useFetchCategories } from '@/hooks/useFetchCategories';
import { useFetchMatches } from '@/hooks/useFetchMatches';
import { CategoryStandings } from '@/app/(main)/categories/components/CategoryStandings';
import { CategoryMatches } from '@/app/(main)/categories/components/CategoryMatches';
import { CategoryPosts } from '@/app/(main)/categories/components/CategoryPosts';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {currentCategory.name}{currentCategory.description && ` - ${currentCategory.description}`}
        </h1>
      </div>
      
      {/* Responsive Grid Layout with Different Ordering */}
      <div className="grid grid-cols-1 gap-8">
        {/* Posts - Desktop: 1st, Mobile: 3rd */}
        <div className="order-3 md:order-1">
          <CategoryPosts 
            categoryName={currentCategory.name}
            categorySlug={categorySlug}
          />
        </div>
        
        {/* Standings - Desktop: 2nd, Mobile: 1st */}
        <div className="order-1 md:order-2">
          <CategoryStandings 
            categoryId={currentCategory.id} 
            categoryName={currentCategory.name}
          />
        </div>
        
        {/* Matches - Desktop: 3rd, Mobile: 2nd */}
        <div className="order-2 md:order-3">
          <CategoryMatches 
            categoryId={currentCategory.id}
            categoryName={currentCategory.name}
            matches={matches}
            loading={matchesLoading}
            matchweeks={currentCategory.matchweek_count || 0}
          />
        </div>
      </div>
    </div>
  );
}
