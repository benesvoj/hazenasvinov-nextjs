'use client';

import {translations} from '@/lib/translations/index';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/trainingSessions';
import {BaseTrainingSession, TrainingSessionInsert} from '@/types';

export function useTrainingSession() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    BaseTrainingSession,
    TrainingSessionInsert
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.plural,
    messages: {
      createSuccess: translations.trainingSessions.responseMessages.createSuccess,
      updateSuccess: translations.trainingSessions.responseMessages.updateSuccess,
      deleteSuccess: translations.trainingSessions.responseMessages.deleteSuccess,
      createError: translations.trainingSessions.responseMessages.createError,
      updateError: translations.trainingSessions.responseMessages.updateError,
      deleteError: translations.trainingSessions.responseMessages.deleteError,
    },
  })();

  return {
    loading,
    setLoading,
    error,
    createTrainingSession: create,
    updateTrainingSession: update,
    deleteTrainingSession: deleteItem,
  };
}
