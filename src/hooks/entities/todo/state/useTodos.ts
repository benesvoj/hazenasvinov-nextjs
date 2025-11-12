'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {TodoStatuses} from '@/enums';
import {API_ROUTES} from "@/lib";
import {TodoInsert, UpdateTodo} from '@/types';

interface UseTodosReturn {
	loading: boolean;
	createTodo: (data: TodoInsert) => Promise<boolean>;
	updateTodo: (id: string, updates: UpdateTodo) => Promise<boolean>;
	deleteTodo: (id: string) => Promise<boolean>;
	updateTodoStatus: (id: string, status: TodoStatuses) => Promise<boolean>;
}

export const useTodos = (): UseTodosReturn => {
	const [loading, setLoading] = useState(false);

	const createTodo = useCallback(
		async (data: TodoInsert): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.todos.root, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				})
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Add todo failed');
				}

				showToast.success('Todo added successfully!');
				return true;
			} catch (error) {
				console.error('Error adding todo:', error);
				showToast.danger('Failed to add todo');
				return false;
			} finally {
				setLoading(false);
			}
		}, []);

	const updateTodo = useCallback(
		async (id: string, updates: Partial<UpdateTodo>): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.todos.byId(id), {
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(updates),
				})
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Update failed');
				}
				showToast.success('Todo updated successfully!');
				return true;
			} catch (error) {
				console.error('Error updating todo:', error);
				showToast.danger('Failed to update todo');
				return false;
			} finally {
				setLoading(false);
			}
		}, []);

	const deleteTodo = useCallback(
		async (id: string): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.todos.byId(id), {
					method: 'DELETE',
				})
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Delete failed');
				}
				showToast.success('Todo deleted successfully!');
				return true;
			} catch (error) {
				console.error('Error deleting todo:', error);
				showToast.danger('Failed to delete todo');
				return false;
			} finally {
				setLoading(false);
			}
		}, []);

	const updateTodoStatus = useCallback(
		async (id: string, status: TodoStatuses): Promise<boolean> => {
			try {
				setLoading(true)

				const res = await fetch(API_ROUTES.todos.byId(id), {
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({status}),
				})
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
		}, []);

	return {
		// State
		loading,
		// CRUD operations
		createTodo,
		updateTodo,
		deleteTodo,
		updateTodoStatus,
	};
};
