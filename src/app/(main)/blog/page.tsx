import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQueries} from '@/utils/prefetch';

import {fetchBlogPosts} from '@/queries/blogPosts/queries';
import {fetchCategories} from '@/queries/categories/queries';

import {BlogListingClient} from './BlogListingClient';

/**
 * Blog listing page - Server Component
 * Follows the same pattern as admin pages (seasons, committees, etc.)
 */
export default async function BlogPage() {
  // Prefetch blog posts AND categories on server
  const dehydratedState = await prefetchQueries([
    {queryKey: ['blog-posts'], queryFn: fetchBlogPosts},
    {queryKey: ['categories'], queryFn: fetchCategories},
  ]);

  return (
    <HydrationBoundary state={dehydratedState}>
      <BlogListingClient />
    </HydrationBoundary>
  );
}

/**
 * Enable ISR (Incremental Static Regeneration)
 * Revalidate every 10 minutes for fresh content
 */
export const revalidate = 600;
