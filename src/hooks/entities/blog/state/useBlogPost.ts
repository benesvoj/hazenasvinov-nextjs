'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {Blog, BlogPostInsert} from '@/types';

const t = translations.admin.blog.responseMessages;

/**
 * Hook for managing blog posts (CRUD operations)
 * Generated using createCRUDHook factory
 * @todo Rename to useFetchBlogPosts for clarity after deprecating old hook.
 */
const _useBlogPost = createCRUDHook<Blog, BlogPostInsert>({
  baseEndpoint: API_ROUTES.entities.root('blog_posts'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('blog_posts', id),
  entityName: 'blogPosts',
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useBlogPost() {
  const {loading, error, create, update, deleteItem, setLoading} = _useBlogPost();

  return {
    loading,
    error,
    createBlogPost: create,
    updateBlogPost: update,
    deleteBlogPost: deleteItem,
    setLoading,
  };
}
