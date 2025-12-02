'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {CreateGrant, Grant} from '@/types';

const t = translations.admin.grants.responseMessages;

const _useGrants = createCRUDHook<Grant, CreateGrant>({
  baseEndpoint: API_ROUTES.entities.root('grants'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('grants', id),
  entityName: 'grant',
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

export function useGrants() {
  const {loading, error, create, update, deleteItem, setLoading} = _useGrants();

  return {
    loading,
    error,
    createGrant: create,
    updateGrant: update,
    deleteGrant: deleteItem,
    setLoading,
  };
}
