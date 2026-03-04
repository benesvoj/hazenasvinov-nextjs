'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/blogPosts';
import {Blog, BlogPostInsert} from '@/types';

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useBlogPost() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    Blog,
    BlogPostInsert
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.plural,
    messages: {
      createSuccess: translations.blogPosts.responseMessages.createSuccess,
      updateSuccess: translations.blogPosts.responseMessages.updateSuccess,
      deleteSuccess: translations.blogPosts.responseMessages.deleteSuccess,
      createError: translations.blogPosts.responseMessages.createError,
      updateError: translations.blogPosts.responseMessages.updateError,
      deleteError: translations.blogPosts.responseMessages.deleteError,
    },
  })();

  return {
    loading,
    error,
    createBlogPost: create,
    updateBlogPost: update,
    deleteBlogPost: deleteItem,
    setLoading,
  };
}
