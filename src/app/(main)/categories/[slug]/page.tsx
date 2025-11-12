import {notFound} from 'next/navigation';

import {getCategoryPageData} from '@/utils/categoryPageData';

import {
  CategoryStandings,
  CategoryMatches,
  CategoryPosts,
} from '@/app/(main)/categories/components';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({params}: CategoryPageProps) {
  const awaitedParams = await params;
  if (!awaitedParams?.slug?.trim()) {
    notFound();
  }
  const categorySlug = awaitedParams.slug;

  // TODO: REFACTOR
  try {
    // Fetch all data server-side in optimized batches
    const {category, matches, posts, standings, season} = await getCategoryPageData(categorySlug);

    if (!category) {
      notFound();
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {category.name}
            {category.description && ` - ${category.description}`}
          </h1>
        </div>

        {/* Responsive Grid Layout with Different Ordering */}
        <div className="grid grid-cols-1 gap-8">
          {/* Posts - Desktop: 1st, Mobile: 3rd */}
          <div className="order-3 md:order-1">
            <CategoryPosts categoryId={category.id} posts={posts} />
          </div>

          {/* Standings - Desktop: 2nd, Mobile: 1st */}
          <div className="order-1 md:order-2">
            <CategoryStandings
              categoryId={category.id}
              categoryName={category.name}
              standings={standings}
            />
          </div>

          {/* Matches - Desktop: 3rd, Mobile: 2nd */}
          <div className="order-2 md:order-3">
            <CategoryMatches
              categoryId={category.id}
              categoryName={category.name}
              matches={matches}
              matchweeks={matches.autumn.length + matches.spring.length}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading category page:', error);
    notFound();
  }
}
