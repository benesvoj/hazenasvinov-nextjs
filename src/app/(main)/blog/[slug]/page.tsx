import {HydrationBoundary} from '@tanstack/react-query';

import {prefetchQuery} from '@/utils/prefetch';

import {fetchBlogPostBySlug} from '@/queries/blogPosts/queries';

import {BlogPostClient} from './BlogPostClient';

/**
 * Blog post detail page - Server Component
 * Follows the same pattern as admin pages (seasons, committees, etc.)
 */
export default async function BlogPostPage({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;

  // Prefetch blog post data on server
  const dehydratedState = await prefetchQuery(['blog-post', slug], () => fetchBlogPostBySlug(slug));

  return (
    <HydrationBoundary state={dehydratedState}>
      <BlogPostClient slug={slug} />
    </HydrationBoundary>
  );
}

/**
 * Pre-render popular posts at build time
 * Uses admin client (no cookies needed at build time)
 */
export async function generateStaticParams() {
  const {default: supabaseAdmin} = await import('@/utils/supabase/admin');

  const {data: posts} = await supabaseAdmin
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', {ascending: false})
    .limit(20);

  return posts?.map((post) => ({slug: post.slug})) || [];
}

/**
 * Enable ISR (Incremental Static Regeneration)
 * Revalidate every hour for fresh content
 */
export const revalidate = 3600;
