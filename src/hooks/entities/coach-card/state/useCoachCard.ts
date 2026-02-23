'use client';

import {translations} from '@/lib/translations/index';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/coachCards';
import {CoachCard, CoachCardInsert} from '@/types';

/**
 * Hook for coach card CRUD operations
 * Uses the factory pattern for consistent mutations
 */
export function useCoachCard() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    CoachCard,
    CoachCardInsert
  >({
    baseEndpoint: API_ROUTES.coachCards.root,
    byIdEndpoint: (id) => API_ROUTES.coachCards.byId(id),
    entityName: ENTITY.singular,
    messages: {
      createSuccess: translations.coachCards.responseMessages.createSuccess,
      updateSuccess: translations.coachCards.responseMessages.updateSuccess,
      deleteSuccess: translations.coachCards.responseMessages.deleteSuccess,
      createError: translations.coachCards.responseMessages.createError,
      updateError: translations.coachCards.responseMessages.updateError,
      deleteError: translations.coachCards.responseMessages.deleteError,
    },
  })();

  return {
    loading,
    error,
    setLoading,
    createCoachCard: create,
    updateCoachCard: update,
    deleteCoachCard: deleteItem,
  };
}
