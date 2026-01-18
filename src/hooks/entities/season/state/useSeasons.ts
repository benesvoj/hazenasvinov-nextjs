'use client';

import {translations} from '@/lib/translations';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/seasons';
import {Season, SeasonInsert} from '@/types';

const t = translations.admin.seasons.responseMessages;

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useSeasons() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    Season,
    SeasonInsert
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
    createSeason: create,
    updateSeason: update,
    deleteSeason: deleteItem,
    setLoading,
  };
}
