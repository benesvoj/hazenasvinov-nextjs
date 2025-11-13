'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';

export interface CRUDHookConfig {
	/** Base API endpoint (e.g., '/api/committees') */
	baseEndpoint: string;
	/** Function to get endpoint by ID (e.g., (id) => `/api/committees/${id}`) */
	byIdEndpoint: (id: string) => string;
	/** Entity name for messages (e.g., "committee") */
	entityName: string;
	/** Success messages */
	messages: {
		createSuccess: string;
		updateSuccess: string;
		deleteSuccess: string;
		createError: string;
		updateError: string;
		deleteError: string;
	};
}

export interface CRUDHookResult<T, TInsert> {
	loading: boolean;
	error: string | null;
	create: (data: TInsert) => Promise<T | void>;
	update: (id: string, data: Partial<TInsert>) => Promise<T | void>;
	deleteItem: (id: string) => Promise<{ success: boolean } | void>;
	setLoading: (loading: boolean) => void;
}

/**
 * Factory function to create CRUD operation hooks
 *
 * @example
 * const useCommittees = createCRUDHook<Committee, CommitteeInsert>({
 *   baseEndpoint: API_ROUTES.committees.root,
 *   byIdEndpoint: API_ROUTES.committees.byId,
 *   entityName: 'committee',
 *   messages: {
 *     createSuccess: 'Committee created',
 *     updateSuccess: 'Committee updated',
 *     deleteSuccess: 'Committee deleted',
 *     createError: 'Failed to create committee',
 *     updateError: 'Failed to update committee',
 *     deleteError: 'Failed to delete committee',
 *   }
 * });
 */
export function createCRUDHook<T, TInsert>(
	config: CRUDHookConfig
): () => CRUDHookResult<T, TInsert> {
	const {baseEndpoint, byIdEndpoint, entityName, messages} = config;

	return function useCRUD(): CRUDHookResult<T, TInsert> {
		const [loading, setLoading] = useState(false);
		const [error, setError] = useState<string | null>(null);

		// CREATE
		const create = useCallback(
			async (data: TInsert): Promise<T | void> => {
				try {
					setLoading(true);
					setError(null);

					const res = await fetch(baseEndpoint, {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify(data),
					});
					const response = await res.json();

					if (!res.ok || response.error) {
						throw new Error(response.error || messages.createError);
					}

					showToast.success(messages.createSuccess);
					return response.data as T;
				} catch (err: any) {
					console.error(`Error creating ${entityName}:`, err);
					const errorMsg = err.message || messages.createError;
					setError(errorMsg);
					showToast.danger(errorMsg);
				} finally {
					setLoading(false);
				}
			},
			[baseEndpoint, entityName, messages]
		);

		// UPDATE
		const update = useCallback(
			async (id: string, data: Partial<TInsert>): Promise<T | void> => {
				try {
					setLoading(true);
					setError(null);

					const res = await fetch(byIdEndpoint(id), {
						method: 'PATCH',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify(data),
					});
					const response = await res.json();

					if (!res.ok || response.error) {
						throw new Error(response.error || messages.updateError);
					}

					showToast.success(messages.updateSuccess);
					return response.data as T;
				} catch (err: any) {
					console.error(`Error updating ${entityName}:`, err);
					const errorMsg = err.message || messages.updateError;
					setError(errorMsg);
					showToast.danger(errorMsg);
				} finally {
					setLoading(false);
				}
			},
			[byIdEndpoint, entityName, messages]
		);

		// DELETE
		const deleteItem = useCallback(
			async (id: string): Promise<{ success: boolean } | void> => {
				try {
					setLoading(true);
					setError(null);

					const res = await fetch(byIdEndpoint(id), {
						method: 'DELETE',
					});
					const response = await res.json();

					if (!res.ok || response.error) {
						throw new Error(response.error || messages.deleteError);
					}

					showToast.success(messages.deleteSuccess);
					return {success: true};
				} catch (err: any) {
					console.error(`Error deleting ${entityName}:`, err);
					const errorMsg = err.message || messages.deleteError;
					setError(errorMsg);
					showToast.danger(errorMsg);
				} finally {
					setLoading(false);
				}
			},
			[byIdEndpoint, entityName, messages]
		);

		return {
			loading,
			error,
			create,
			update,
			deleteItem,
			setLoading,
		};
	};
}