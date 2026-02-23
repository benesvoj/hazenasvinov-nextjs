import {notFound} from 'next/navigation';

import {getCategoryPageData} from '@/utils/categoryPageData';

import {
  CategoryMatches,
  CategoryPosts,
  CategoryStandings,
} from '@/app/(main)/categories/components';

import {ContactsSection} from '@/components';
import {hasItems, isNotNilOrEmpty} from '@/utils';

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

  const {category, matches, posts, standings, coachCards} = await getCategoryPageData(categorySlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {category?.name}
          {category?.description && ` - ${category?.description}`}
        </h1>
      </div>

      {/* Responsive Grid Layout with Different Ordering */}
      <div className="grid grid-cols-1 gap-8">
        {/* Posts - Desktop: 1st, Mobile: 3rd */}
        {isNotNilOrEmpty(category) && (
          <>
            <div className="order-3 md:order-1">
              <CategoryPosts categoryId={category.id} posts={posts} />
            </div>

            <div className="order-1 md:order-2">
              <CategoryStandings
                categoryId={category.id}
                categoryName={category.name}
                standings={standings}
              />
            </div>

            <div className="order-2 md:order-3">
              <CategoryMatches
                categoryId={category.id}
                categoryName={category.name}
                matches={matches}
                matchweeks={matches.autumn.length + matches.spring.length}
              />
            </div>
          </>
        )}
        {hasItems(coachCards) && (
          <div className="order-4">
            <ContactsSection contacts={coachCards} />
          </div>
        )}
      </div>
    </div>
  );
}
