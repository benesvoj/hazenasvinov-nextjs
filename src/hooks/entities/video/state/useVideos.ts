'use client';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE} from '@/queries/videos';
import {VideoInsert, VideoSchema} from '@/types';

export function useVideos() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    VideoSchema,
    VideoInsert
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: DB_TABLE,
    messages: {
      createSuccess: translations.matchRecordings.responseMessages.createSuccess,
      updateSuccess: translations.matchRecordings.responseMessages.updateSuccess,
      deleteSuccess: translations.matchRecordings.responseMessages.deleteSuccess,
      createError: translations.matchRecordings.responseMessages.createError,
      updateError: translations.matchRecordings.responseMessages.updateError,
      deleteError: translations.matchRecordings.responseMessages.deleteError,
    },
  })();

  return {
    loading,
    setLoading,
    error,
    createVideo: create,
    updateVideo: update,
    deleteVideo: deleteItem,
  };
}
