'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE} from '@/queries/comments';
import {BaseComment} from '@/types';

const t = translations.admin.comments.responseMessages;

export const useFetchComments = createDataFetchHook<BaseComment>({
  endpoint: API_ROUTES.entities.root(DB_TABLE),
  entityName: 'comments',
  errorMessage: t.commentsFetchFailed,
});
