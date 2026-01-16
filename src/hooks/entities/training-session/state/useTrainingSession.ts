'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/trainingSessions';
import {BaseTrainingSession, TrainingSessionInsert} from '@/types';

const t = translations.coachPortal.trainingSessions.responseMessages;

const _useTrainingSession = createCRUDHook<BaseTrainingSession, TrainingSessionInsert>({
  baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
  byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
  entityName: ENTITY.plural,
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

export function useTrainingSession() {
  const {loading, setLoading, error, create, update, deleteItem} = _useTrainingSession();

  return {
    loading,
    setLoading,
    error,
    createTrainingSession: create,
    updateTrainingSession: update,
    deleteTrainingSession: deleteItem,
  };
}
