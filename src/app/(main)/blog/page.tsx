import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';

import {fetchBlogPosts} from '@/queries/blogPosts/queries';

import {BlogListingClient} from './BlogListingClient';

/**
 * Blog listing page - Server Component
 * Follows the same pattern as admin pages (seasons, committees, etc.)
 */
export default async function BlogPage() {
  // Prefetch blog posts on server using React Query pattern
  const dehydratedState = await prefetchQuery(['blog-posts'], fetchBlogPosts);

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
