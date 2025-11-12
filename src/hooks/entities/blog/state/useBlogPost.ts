'use client';

import {useCallback, useState} from "react";

import {showToast} from "@/components";
import {API_ROUTES} from "@/lib";
import {CreateBlogPost, UpdateBlogPost} from "@/types";

 interface UseBlogReturn {
	loading: boolean;
	createBlog: (data: CreateBlogPost) => Promise<boolean>;
	updateBlog: (id: string, data: UpdateBlogPost) => Promise<boolean>;
	deleteBlog: (id: string) => Promise<boolean>;
}

/**
 * UseBlog hook
 * @returns {UseBlogReturn} - Object containing loading state and blog management functions
 * @description Hook for managing blog posts: create, update, delete
 */

export const useBlogPost = (): UseBlogReturn => {
	const [loading, setLoading] = useState<boolean>(false);

	const createBlog = useCallback(
		async (data: CreateBlogPost): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.blog.root, {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Create blog post failed');
				}
				showToast.success('Blog post created successfully!');
				return true;
			} catch (error) {
				console.error('Error creating blog post:', error);
				showToast.danger('Error creating blog post');
				return false;
			} finally {
				setLoading(false
				)
			}
		}, [])

	const updateBlog = useCallback(
		async (id: string, data: UpdateBlogPost): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.blog.byId(id), {
					method: 'PATCH',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify(data),
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Update blog post failed');
				}

				showToast.success('Blog post updated successfully!');
				return true;
			} catch (error) {
				console.error('Error updating blog post:', error);
				showToast.danger('Error updating blog post');
				return false;
			} finally {
				setLoading(false);
			}
		}, [])

	const deleteBlog = useCallback(
		async (id: string): Promise<boolean> => {
			try {
				setLoading(true);

				const res = await fetch(API_ROUTES.blog.byId(id), {
					method: 'DELETE',
				});
				const response = await res.json();

				if (!res.ok || response.error) {
					throw new Error(response.error || 'Delete blog post failed');
				}

				showToast.success('Blog post deleted successfully!');
				return true;
			} catch (error) {
				console.error('Error deleting blog post:', error);
				showToast.danger('Error deleting blog post');
				return false;
			} finally {
				setLoading(false);
			}
		}, [])


	return {
		loading,
		createBlog,
		updateBlog,
		deleteBlog,
	}
}