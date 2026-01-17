'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/comments';
import {BaseComment, CommentInsert} from '@/types';

const t = translations.admin.comments.responseMessages;

export function useComments() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    BaseComment,
    CommentInsert
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.plural,
    messages: {
      createSuccess: t.createSuccess,
      updateSuccess: t.updateSuccess,
      deleteSuccess: t.deleteSuccess,
      createError: t.createError,
      updateError: t.updateError,
      deleteError: t.deleteError,
    },
  })();

  return {
    loading,
    setLoading,
    error,
    createComment: create,
    updateComment: update,
    deleteComment: deleteItem,
  };
}
