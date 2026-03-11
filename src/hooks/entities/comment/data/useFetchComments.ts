'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE} from '@/queries/comments';
import {BaseComment} from '@/types';

const t = translations.comments.responseMessages;

export function useFetchComments() {
  return createDataFetchHook<BaseComment>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: 'comments',
    errorMessage: t.commentsFetchFailed,
  })();
}
