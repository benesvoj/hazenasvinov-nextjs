'use client';

import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE} from '@/queries/videos';
import {VideoInsert, VideoSchema} from '@/types';

const t = translations.admin.videos.responseMessages;

const _useVideos = createCRUDHook<VideoSchema, VideoInsert>({
  baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
  byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
  entityName: DB_TABLE,
  messages: {
    createSuccess: t.createSuccess,
    updateSuccess: t.updateSuccess,
    deleteSuccess: t.deleteSuccess,
    createError: t.createError,
    updateError: t.updateError,
    deleteError: t.deleteError,
  },
});

export function useVideos() {
  const {loading, setLoading, error, create, update, deleteItem} = _useVideos();

  return {
    loading,
    setLoading,
    error,
    createVideo: create,
    updateVideo: update,
    deleteVideo: deleteItem,
  };
}
