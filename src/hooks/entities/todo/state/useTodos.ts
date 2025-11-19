'use client';

import {useCallback} from 'react';

import {showToast} from '@/components';
import {TodoStatuses} from '@/enums';
import {createCRUDHook} from '@/hooks';
import {API_ROUTES, translations} from '@/lib';
import {DB_TABLE} from '@/queries/todos';
import {TodoInsert, TodoItem, UpdateTodo} from '@/types';

const t = translations.admin.todos.responseMessages;

const _useTodos = createCRUDHook<TodoItem, TodoInsert>({
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

export function useTodos() {
  const {loading, setLoading, error, create, update, deleteItem} = _useTodos();

  const updateTodoStatus = useCallback(
    async (id: string, status: TodoStatuses): Promise<boolean> => {
      try {
        setLoading(true);

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
