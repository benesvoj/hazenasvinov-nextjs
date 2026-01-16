'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/videos';
import {VideoSchema} from '@/types';

const t = translations.admin.videos.responseMessages;

export function useFetchVideos() {
  return createDataFetchHook<VideoSchema>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: t.videosFetchFailed,
  });
}
