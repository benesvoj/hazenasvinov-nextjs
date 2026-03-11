'use client';

import {useCallback} from 'react';

import {createCRUDHook} from '@/hooks/factories';

import {API_ROUTES} from '@/lib/api-routes';
import {translations} from '@/lib/translations';

import {showToast} from '@/components';
import {TodoStatuses} from '@/enums';
import {DB_TABLE} from '@/queries/todos';
import {TodoInsert, TodoItem} from '@/types';

export function useTodos() {
  const {loading, setLoading, error, create, update, deleteItem} = createCRUDHook<
    TodoItem,
    TodoInsert
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: DB_TABLE,
    messages: {
      createSuccess: translations.todos.responseMessages.createSuccess,
      updateSuccess: translations.todos.responseMessages.updateSuccess,
      deleteSuccess: translations.todos.responseMessages.deleteSuccess,
      createError: translations.todos.responseMessages.createError,
      updateError: translations.todos.responseMessages.updateError,
      deleteError: translations.todos.responseMessages.deleteError,
    },
  })();

  const updateTodoStatus = useCallback(
    async (id: string, status: TodoStatuses): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch(API_ROUTES.todos.byId(id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({status}),
        });
        const response = await res.json();

        if (!res.ok || response.error) {
          throw new Error(response.error || 'Update status failed');
        }

        showToast.success(`Todo marked as ${status}!`);
        return true;
      } catch (error) {
        console.error('Error updating todo status:', error);
        showToast.danger('Failed to update todo status');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    setLoading,
    error,
    createTodo: create,
    updateTodo: update,
    deleteTodo: deleteItem,
    updateTodoStatus,
  };
}
