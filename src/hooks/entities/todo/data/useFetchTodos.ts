'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {DB_TABLE, ENTITY} from '@/queries/todos';
import {TodoItem} from '@/types';

export function useFetchTodos() {
  return createDataFetchHook<TodoItem>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: translations.todos.responseMessages.todosFetchFailed,
  })();
}
