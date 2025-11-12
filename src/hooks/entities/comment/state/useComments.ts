'use client';

import {useCallback, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES} from "@/lib";
import {BaseComment, CommentInsert} from '@/types';

export interface UseCommentsReturn {
	loading: boolean;
	createComment: (data: CommentInsert) => Promise<boolean>;
	updateComment: (id: string, updates: Partial<BaseComment>) => Promise<boolean>;
	deleteComment: (id: string) => Promise<boolean>;
}

export const useComments = (): UseCommentsReturn => {
	const [loading, setLoading] = useState(false);

	const createComment = useCallback(
		async (data: CommentInsert): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.comments.root, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				})
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Add comment failed');
				}

				showToast.success('Comment added successfully!');
				return true;
			} catch (error) {
				console.error('Error adding comment:', error);
				showToast.danger('Error adding comment');
				return false;
			} finally {
				setLoading(false);
			}
		}, []);

	const updateComment = useCallback(
		async (id: string, updates: Partial<BaseComment>): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.comments.byId(id), {
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(updates),
				})
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Update comment failed');
				}

				showToast.success('Comment updated successfully!');
				return true;
			} catch (error) {
				console.error('Error updating comment:', error);
				showToast.danger('Failed to update comment');
				return false;
			} finally {
				setLoading(false);
			}
		}, []);

	const deleteComment = useCallback(
		async (id: string): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.comments.byId(id), {
					method: 'DELETE',
				})
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Delete comment failed');
				}
				showToast.success('Comment deleted successfully!');
				return true;
			} catch (error) {
				console.error('Error deleting comment:', error);
				showToast.danger('Failed to delete comment');
				return false;
			} finally {
				setLoading(false);
			}
		}, []);

	return {
		loading,
		createComment,
		updateComment,
		deleteComment,
	};
};
