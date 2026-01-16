'use client';

import {createDataFetchHook} from '@/hooks/factories';

import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE} from '@/queries/todos';
import {TodoItem} from '@/types';

const t = translations.admin.todos.responseMessages;

export function useFetchTodos() {
	return createDataFetchHook<TodoItem>({
		endpoint: API_ROUTES.entities.root(DB_TABLE),
		entityName: 'todos',
		errorMessage: t.todosFetchFailed,
	});

}