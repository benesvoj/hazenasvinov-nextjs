'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/tournaments';
import {CreateTournament, Tournament} from '@/types';

const t = translations.tournaments.responseMessages;

export function useTournaments() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    Tournament,
    CreateTournament
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
    createTournament: create,
    updateTournament: update,
    deleteTournament: deleteItem,
    setLoading,
  };
}
