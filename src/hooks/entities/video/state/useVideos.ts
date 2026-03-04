'use client';

import {translations} from "@/lib/translations/index";

import {createCRUDHook} from '@/hooks';
import {API_ROUTES} from '@/lib';
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
      createSuccess: translations.videos.responseMessages.createSuccess,
      updateSuccess: translations.videos.responseMessages.updateSuccess,
      deleteSuccess: translations.videos.responseMessages.deleteSuccess,
      createError: translations.videos.responseMessages.createError,
      updateError: translations.videos.responseMessages.updateError,
      deleteError: translations.videos.responseMessages.deleteError,
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
