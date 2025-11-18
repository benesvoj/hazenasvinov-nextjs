import {NextRequest} from 'next/server';

import {successResponse, withAuth} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/blog-posts-published
 *
 * Fetch published blog posts with optional limit
 *
 * @query limit - Number of posts to return (default: 10, max: 100)
 * @example GET /api/blog-posts-published?limit=3
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    // Get query parameters from URL
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');

    // Parse and validate limit
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 10;
    const validLimit = isNaN(limit) ? 10 : limit;

    const {data, error} = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', {ascending: false})
      .order('created_at', {ascending: false})
      .limit(validLimit);

    if (error) throw error;

    return successResponse(data);
  });
}
