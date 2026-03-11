'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/videos';
import {VideoSchema} from '@/types';

/**
 * Custom hook to fetch video data based on provided category IDs.
 *
 * @param {string[]} [categoryIds] - Optional array of category IDs to filter the videos. If no category IDs are provided, all videos will be fetched.
 * @return {Function} A function that, when invoked, initiates the data fetch and returns the fetched video data adhering to the `VideoSchema`.
 */
export function useFetchVideos(categoryIds?: string[]) {
  const params = categoryIds?.length ? `?category_ids=${categoryIds.join(',')}` : '';

  return createDataFetchHook<VideoSchema>({
    endpoint: API_ROUTES.entities.root(DB_TABLE) + params,
    entityName: ENTITY.plural,
    errorMessage: translations.matchRecordings.responseMessages.fetchFailed,
  })();
}
