'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {BaseCategoryLineupMember, CreateCategoryLineupMember} from '@/types';

export function useCategoryLineupMembers() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    BaseCategoryLineupMember,
    CreateCategoryLineupMember
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.plural,
    messages: {
      createSuccess: translations.lineupMembers.responseMessages.createSuccess,
      updateSuccess: translations.lineupMembers.responseMessages.updateSuccess,
      deleteSuccess: translations.lineupMembers.responseMessages.deleteSuccess,
      createError: translations.lineupMembers.responseMessages.createError,
      updateError: translations.lineupMembers.responseMessages.updateError,
      deleteError: translations.lineupMembers.responseMessages.deleteError,
    },
  })();

  return {
    loading,
    setLoading,
    error,
    createCategoryLineupMember: create,
    updateCategoryLineupMember: update,
    removeCategoryLineupMember: deleteItem,
  };
}
