'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {translations} from '@/lib/translations/index';

import {API_ROUTES} from '@/lib';
import {DB_TABLE, ENTITY} from '@/queries/todos';
import {TodoItem} from '@/types';

export function useFetchTodos() {
  return createDataFetchHook<TodoItem>({
    endpoint: API_ROUTES.entities.root(DB_TABLE),
    entityName: ENTITY.plural,
    errorMessage: translations.todos.responseMessages.todosFetchFailed,
  })();
}
