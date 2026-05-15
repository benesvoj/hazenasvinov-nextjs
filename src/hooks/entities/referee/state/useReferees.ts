'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE} from '@/queries/referees';
import {Referee, RefereeInsert} from '@/types';

export function useReferees() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    Referee,
    RefereeInsert
  >({
    baseEndpoint: API_ROUTES.referees.root,
    byIdEndpoint: (id) => API_ROUTES.referees.byId(id),
    entityName: DB_TABLE,
    messages: {
      createSuccess: translations.referees.responseMessages.createSuccess,
      updateSuccess: translations.referees.responseMessages.updateSuccess,
      deleteSuccess: translations.referees.responseMessages.deleteSuccess,
      createError: translations.referees.responseMessages.createError,
      updateError: translations.referees.responseMessages.updateError,
      deleteError: translations.referees.responseMessages.deleteError,
    },
  })();

  return {
    loading,
    setLoading,
    error,
    createReferee: create,
    updateReferee: update,
    deleteReferee: deleteItem,
  };
}
