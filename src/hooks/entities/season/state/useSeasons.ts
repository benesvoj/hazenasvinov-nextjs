'use client';

import {translations} from '@/lib/translations';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES} from '@/lib';
import {Season, SeasonInsert} from '@/types';

const t = translations.admin.seasons.responseMessages;

/**
 * Hook for managing seasons (CRUD operations)
 * Generated using createCRUDHook factory
 */
const _useSeasons = createCRUDHook<Season, SeasonInsert>({
  baseEndpoint: API_ROUTES.entities.root('seasons'),
  byIdEndpoint: (id) => API_ROUTES.entities.byId('seasons', id),
  entityName: 'season',
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useSeasons() {
  const {loading, error, create, update, deleteItem, setLoading} = _useSeasons();

  return {
    loading,
    error,
    createSeason: create,
    updateSeason: update,
    deleteSeason: deleteItem,
    setLoading,
  };
}
