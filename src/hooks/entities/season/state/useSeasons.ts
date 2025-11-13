'use client';

import {translations} from '@/lib/translations';

import {createCRUDHook} from "@/hooks";
import {API_ROUTES} from "@/lib";
import {Season, SeasonInsert} from '@/types';

const t = translations.admin.seasons.responseMessages

/**
 * Hook for managing seasons (CRUD operations)
 * Generated using createCRUDHook factory
 */
const _useCommittees = createCRUDHook<Season, SeasonInsert>({
  baseEndpoint: API_ROUTES.seasons.root,
  byIdEndpoint: API_ROUTES.seasons.byId,
  entityName: 'season',
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  }
})

/**
 * Wrapper to maintain backward compatibility with existing API
 * Maps factory hook methods to expected names
 */
export function useSeasons() {
  const {loading, error, create, update, deleteItem, setLoading} = _useCommittees();

  return {
    loading,
    error,
    createSeason: create,
    updateSeason: update,
    deleteSeason: deleteItem,
    setLoading,
  }
}