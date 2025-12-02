import {NextRequest} from 'next/server';

import {errorResponse, successResponse, withAuth} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/blog-posts/by-slug/[slug]
 *
 * Fetch published blog post via slug
 *
 * @query slug - Slug of the blog post to retrieve
 * @example GET /api/blog/by-slug/my-first-blog-post
 */
export async function GET(request: NextRequest, {params}: {params: Promise<{slug: string}>}) {
  return withAuth(async (user, supabase) => {
    const {slug} = await params;

    if (!slug) {
      return errorResponse('Slug is required', 400);
    }

    try {
      const {data: postData, error: postError} = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError) {
        if (postError.code === 'PGRST116') {
          return errorResponse('Blog post not found', 404);
        }
        throw postError;
      }

      let relatedPosts = [];

      if (postData.category_id) {
        const {data: relatedData, error: relatedError} = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('category_id', postData.category_id)
          .neq('slug', slug)
          .order('published_at', {ascending: false})
          .order('created_at', {ascending: false})
          .limit(3);

        if (!relatedError && relatedData) {
          relatedPosts = relatedData;
        }
      }
      return successResponse({
        post: postData,
        relatedPosts,
      });
    } catch (err) {
      console.error('Error fetching blog post by slug: ', err);
      return errorResponse('Error fetching blog post by slug: ', 500);
    }
  });
}
