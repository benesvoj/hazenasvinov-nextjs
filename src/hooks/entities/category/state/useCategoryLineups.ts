/**
 * Hook to manage CRUD operations for category lineups
 */

'use client';

import {useCallback, useState} from 'react';

import {
	CreateCategoryLineup,
	UpdateCategoryLineup,
} from '@/types/entities/category/data/categoryLineup';

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";

export function useCategoryLineups() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createLineup = useCallback(
		async (data: CreateCategoryLineup) => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.categories.lineups(data.category_id), {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Failed to create lineup');
				}

				showToast.success('Lineup created successfully');
				return response;
			} catch (error) {
				console.error('Error creating lineup:', error);
				showToast.danger('Failed to create lineup');
			} finally {
				setLoading(false);
			}
		}, []);

	// Update a lineup
	const updateLineup = useCallback(
		async (categoryId: string, id: string, data: Partial<UpdateCategoryLineup>) => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.categories.lineupById(categoryId, id), {
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Failed to update lineup');
				}

				showToast.success('Lineup updated successfully');
				return response;

			} catch (error) {
				console.error('Error updating lineup:', error);
				showToast.danger('Failed to update lineup');
			} finally {
				setLoading(false);
			}
		}, [])

	// Delete a lineup
	const deleteLineup = useCallback(
		async (categoryId: string, id: string) => {
			try {
				setLoading(true)
				setError(null);

				const res = await fetch(API_ROUTES.categories.lineupById(categoryId, id), {
					method: 'DELETE',
				})
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Failed to delete lineup');
				}

				showToast.success('Lineup deleted');
				return {success: true};
			} catch (error) {
				console.error('Error deleting lineup:', error);
				showToast.danger('Failed to delete lineup');
			} finally {
				setLoading(false);
			}
		}, []);

	return {
		loading,
		error,
		setError,
		createLineup,
		updateLineup,
		deleteLineup,
	};
}
