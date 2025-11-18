/**
 * API Route Helpers with Query Parameters
 *
 * MANUAL FILE - NOT AUTO-GENERATED
 * This file contains helper functions for API routes that use query parameters.
 * The main api-routes.ts is auto-generated and should not be manually edited.
 *
 * To add new query param helpers:
 * 1. Import the route from api-routes.ts
 * 2. Create a helper function using buildUrl utility
 */

import {API_ROUTES} from '@/lib';
import {buildUrl} from '@/utils';

/**
 * API route helpers with query parameters
 */
export const API_HELPERS = {
  /**
   * Blog post published API helpers
   */
  blogPostsPublished: {
    /**
     * Get published blog posts with limit
     * @param limit - Number of posts to return (default: 10, max: 100)
     * @example API_HELPERS.blogPostPublished.withLimit(3)
     * // => '/api/blog-posts-published?limit=3'
     */
    withLimit: (limit: number) => buildUrl(API_ROUTES.blogPostsPublished, {limit}),

    /**
     * Get published blog posts with multiple filters
     * @example API_HELPERS.blogPostPublished.withParams({ limit: 5 })
     */
    withParams: (params: {limit?: number}) => buildUrl(API_ROUTES.blogPostsPublished, params),
  },
  blog: {
    bySlug: (slug: string) => API_ROUTES.blog.bySlug.root(slug),
  },
} as const;
