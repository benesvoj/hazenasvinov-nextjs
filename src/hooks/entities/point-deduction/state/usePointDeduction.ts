'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/pointDeductions';
import {CreatePointDeduction, PointDeduction} from '@/types';

const t = translations.pointDeductions.responseMessages;

export function usePointDeduction() {
  const {loading, error, create, update, deleteItem} = createCRUDHook<
    PointDeduction,
    CreatePointDeduction
  >({
    baseEndpoint: API_ROUTES.pointDeductions.root,
    byIdEndpoint: (id) => API_ROUTES.pointDeductions.byId(id),
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
    createPointDeduction: create,
    updatePointDeduction: update,
    deletePointDeduction: deleteItem,
  };
}
