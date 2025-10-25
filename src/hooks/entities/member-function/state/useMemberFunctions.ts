'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES, translations} from '@/lib';
import {CreateMemberFunction} from '@/types';

const t = translations.memberFunctions.responseMessages;
const tCommon = translations.common.responseMessage;

export function useMemberFunctions() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createMemberFunction = useCallback(async (data: CreateMemberFunction) => {
		try {
			setLoading(true);
			setError(null);

			const res = await fetch(API_ROUTES.memberFunctions.root, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});
			const response = await res.json();

			if (!res.ok || response.error) {
				throw new Error(response.error || t.failedInsert);
			}

			showToast.success(t.successInsert);
			return response.data;

		} catch (error) {
			const message = error instanceof Error ? error.message : tCommon.unknownError;
			setError(message);
			showToast.danger(t.failedInsert);
			throw error;

		} finally {
			setLoading(false);
		}
	}, []);

	const updateMemberFunction = useCallback(
		async (id: string, data: Partial<CreateMemberFunction>) => {
			try {
				setLoading(true);
				setError(null);

				const res = await fetch(API_ROUTES.memberFunctions.byId(id), {
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || t.failedUpdate);
				}

				showToast.success(t.successUpdate);
				return response.data;

			} catch (error) {
				const message = error instanceof Error ? error.message : tCommon.unknownError;
				setError(message);
				showToast.danger(t.failedUpdate);
				throw error;

			} finally {
				setLoading(false);
			}
		},
		[]
	);

	const deleteMemberFunction = useCallback(async (id: string) => {
		try {
			setLoading(true);
			setError(null);

			const res = await fetch(API_ROUTES.memberFunctions.byId(id), {
				method: 'DELETE',
			});
			const response = await res.json();

			if (!res.ok || response.error) {
				throw new Error(response.error || t.failedDelete);
			}

			showToast.success(t.successDelete);
			return response.data;

		} catch (error) {
			const message = error instanceof Error ? error.message : tCommon.unknownError;
			setError(message);
			showToast.danger(t.failedDelete);
			throw error;

		} finally {
			setLoading(false);
		}
	}, []);

	return {
		// State
		loading,
		error,

		// CRUD Operations
		createMemberFunction,
		updateMemberFunction,
		deleteMemberFunction,

		// Validation
	};
}
