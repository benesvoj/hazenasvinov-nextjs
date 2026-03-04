'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {Blog} from '@/types';

/**
 * Hook for fetching blog posts
 * Generated using createDataFetchHook factory
 */
export function useFetchBlog() {
  return createDataFetchHook<Blog>({
    endpoint: API_ROUTES.entities.root('blog_posts'),
    entityName: 'blogPosts',
    errorMessage: translations.blogPosts.responseMessages.blogPostsFetchFailed,
  })();
}
