'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {CreateCategory, UpdateCategory} from '@/types';

const t = translations.categories.responseMessages;

export function useCategories() {
	const [loading, setLoading] = useState(false);

	// Create category
	const createCategory = useCallback(
		async (data: CreateCategory) => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.categories.root, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || t.categoryCreationFailed);
				}

				showToast.success(t.categoryCreationSuccess);
				return response;
			} catch (error) {
				console.error(t.categoryCreationFailed, error);
				showToast.danger(t.categoryCreationFailed);
			} finally {
				setLoading(false);
			}
		}, []);

	// Update category
	const updateCategory = useCallback(
		async (id: string, data: Partial<UpdateCategory>) => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.categories.byId(id), {
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || t.categoryUpdateFailed);
				}

				showToast.success(t.categoryUpdatedSuccess);
				return response;
			} catch (error) {
				console.error('Error updating category:', error);
				showToast.danger(t.categoryUpdateFailed);
			} finally {
				setLoading(false);
			}
		}, []);

	// Delete category
	const deleteCategory = useCallback(
		async (id: string) => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.categories.byId(id), {
					method: 'DELETE',
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || t.categoryDeleteFailed);
				}

				showToast.success(t.categoryDeleteSuccess);
				return {success: true};
			} catch (error) {
				console.error('Error deleting category:', error);
				showToast.danger(t.categoryDeleteFailed);
			} finally {
				setLoading(false);
			}
		}, []);

	return {
		// State
		loading,

		// Actions
		createCategory,
		updateCategory,
		deleteCategory,
	};
}
