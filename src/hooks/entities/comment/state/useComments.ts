'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE} from '@/queries/comments';
import {BaseComment, CommentInsert} from '@/types';

const t = translations.admin.comments.responseMessages;

const _useGrants = createCRUDHook<BaseComment, CommentInsert>({
  baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
  byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
  entityName: DB_TABLE,
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

export function useComments() {
  const {loading, setLoading, error, create, update, deleteItem} = _useGrants();

  return {
    loading,
    setLoading,
    error,
    createComment: create,
    updateComment: update,
    deleteComment: deleteItem,
  };
}
