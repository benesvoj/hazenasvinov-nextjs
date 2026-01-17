'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/grants';
import {CreateGrant, Grant} from '@/types';

const t = translations.admin.grants.responseMessages;

export function useGrants() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    Grant,
    CreateGrant
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.singular,
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
    error,
    createGrant: create,
    updateGrant: update,
    deleteGrant: deleteItem,
    setLoading,
  };
}
