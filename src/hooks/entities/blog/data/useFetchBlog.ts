'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {Blog} from '@/types';

const t = translations.admin.blog.responseMessages;

/**
 * Hook for fetching blog posts
 * Generated using createDataFetchHook factory
 */
export const useFetchBlog = createDataFetchHook<Blog>({
  endpoint: API_ROUTES.entities.root('blog_posts'),
  entityName: 'blogPosts',
  errorMessage: t.blogPostsFetchFailed,
});
