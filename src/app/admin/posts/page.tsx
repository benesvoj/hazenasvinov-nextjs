'use client';

import React, {useState} from 'react';

import {Chip, Image, Input, Select, SelectItem, useDisclosure,} from '@heroui/react';

import {PhotoIcon, TagIcon} from '@heroicons/react/24/outline';

import {uploadClubAsset} from "@/utils/supabase/storage";

import {BlogPostModal} from "@/app/admin/posts/components/BlogPostModal";

import {AdminContainer, DeleteConfirmationModal, showToast, UnifiedTable} from '@/components';
import {adminStatusFilterOptions} from '@/constants';
import {ActionTypes, BlogPostStatuses, ModalMode} from '@/enums';
import {formatDateString} from '@/helpers';
import {
	useBlogPost,
	useBlogPostFiltering,
	useBlogPostForm,
	useFetchBlog,
	useFetchCategories,
	useFetchUsers
} from "@/hooks";
import {translations} from '@/lib';
import {Blog, BlogPostInsert} from '@/types';


export default function BlogPostsPage() {
	const t = translations.admin.posts;

	const {users} = useFetchUsers();
	const {data: blogPosts, loading: blogPostsLoading, refetch: refetchBlog} = useFetchBlog()
	const {data: categories, loading: categoriesLoading} = useFetchCategories();

	const {createBlog, updateBlog, deleteBlog, loading: crudLoading} = useBlogPost();

	const blogPostForm = useBlogPostForm();

	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');

	const {filteredPosts, categoryLookupMap} = useBlogPostFiltering({
		blogPosts: blogPosts || [],
		searchTerm,
		statusFilter,
		categories: categories || []
	});

	const {isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose} = useDisclosure();
	const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

	// Event handlers
	const handleAddPostClick = () => {
		blogPostForm.openAddMode();
		onModalOpen();
	};

	const handleEditPostClick = (post: Blog) => {
		blogPostForm.openEditMode(post)
		onModalOpen();
	};

	const handleSubmitPost = async () => {
		const {valid, errors} = blogPostForm.validateForm();

		if (!valid) {
			errors.forEach(error => showToast.danger(error));
			return;
		}

		let imageUrl = blogPostForm.formData.image_url

		if (blogPostForm.imageFile) {
			blogPostForm.setUploadingImage(true);

			const timestamp = Date.now();
			const fileExtension = blogPostForm.imageFile.name.split('.').pop();
			const fileName = `${timestamp}.${fileExtension}`;
			const blogPostId = blogPostForm.selectedPost?.id || 'new';
			const filePath = `blog-images/${blogPostId}/${fileName}`;

			const uploadResult = await uploadClubAsset(blogPostForm.imageFile, filePath);

			if (uploadResult.error) {
				showToast.danger('Chyba při nahrávání obrázku.');
				blogPostForm.setUploadingImage(false);
				return;
			}

			imageUrl = uploadResult.url;
			blogPostForm.setUploadingImage(false);
		}

		let success = false;

		if (blogPostForm.modalMode === ModalMode.ADD) {
			const insertData: BlogPostInsert = {
				...blogPostForm.formData,
				image_url: imageUrl || null,
			}
			success = await createBlog(insertData);
		} else {
			if (!blogPostForm.selectedPost) return;
			success = await updateBlog(blogPostForm.selectedPost.id, {
				id: blogPostForm.selectedPost.id,
				...blogPostForm.formData,
				image_url: imageUrl || null,
			})
		}

		if (success) {
			await refetchBlog();
			blogPostForm.resetForm();
			onModalClose()
		}
	}

	const handleDeletePostClick = (item: Blog) => {
		blogPostForm.openEditMode(item);
		onDeleteOpen();
	};

	const handleDeleteConfirm = async () => {
		if (blogPostForm.selectedPost) {
			const success = await deleteBlog(blogPostForm.selectedPost.id);
			if (success) {
				await refetchBlog();
				blogPostForm.resetForm();
				onDeleteClose();
			}
		}
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case BlogPostStatuses.PUBLISHED:
				return (
					<Chip color="success" variant="flat">
						{adminStatusFilterOptions.published}
					</Chip>
				);
			case BlogPostStatuses.DRAFT:
				return (
					<Chip color="warning" variant="flat">
						{adminStatusFilterOptions.draft}
					</Chip>
				);
			case BlogPostStatuses.ARCHIVED:
				return (
					<Chip color="secondary" variant="flat">
						{adminStatusFilterOptions.archived}
					</Chip>
				);
			default:
				return null;
		}
	};

	const columns = [
		{key: 'image', label: t.table.image},
		{key: 'title', label: t.table.title},
		{key: 'category', label: t.table.category},
		{key: 'author', label: t.table.author},
		{key: 'status', label: t.table.status},
		{key: 'created_at', label: t.table.createdAt},
		{
			key: 'actions', label: t.table.actions, isActionColumn: true,
			actions: [
				{type: ActionTypes.UPDATE, onPress: handleEditPostClick, title: t.actions.editPost},
				{type: ActionTypes.DELETE, onPress: handleDeletePostClick, title: t.actions.deletePost},
			]
		},
	]

	const renderCells = (post: Blog, columnKey: string) => {
		switch (columnKey) {
			case 'image':
				return post.image_url ? (
					<div
						className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
						<Image
							src={post.image_url}
							alt={post.title}
							width={64}
							height={64}
							className="object-cover"
						/>
					</div>
				) : (
					<div
						className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
						<PhotoIcon className="w-6 h-6 text-gray-400"/>
					</div>
				);
			case 'title':
				return (
					<div>
						<div className="font-medium text-gray-900 dark:text-white">
							{post.title}
						</div>
						<div className="text-sm text-gray-500 dark:text-gray-400">
							{post.slug}
						</div>
					</div>
				)
			case 'category':
				return (
					<div className="flex flex-wrap gap-1">
						{post.category_id !== null
							? categoryLookupMap.get(post.category_id) || '-'
							: '-'}
					</div>
				);
			case 'author':
				return (
					<div className="flex items-center gap-2">
						<span className="text-sm">
							{users.find(user => user.id === post.author_id)?.email || '-'}
						</span>
					</div>
				);
			case 'status':
				return getStatusBadge(post.status);
			case 'created_at':
				return (
					<div className="flex items-center gap-2">
						<span
							className="text-sm">{post.created_at ? formatDateString(post.created_at) : '-'}</span>
					</div>
				);
		}
	}

	const filters = (
		<div className="flex flex-col md:flex-row gap-4 w-full">
			<Input
				placeholder={t.filters.searchInputPlaceholder}
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="flex-1"
				startContent={<TagIcon className="w-4 h-4 text-gray-400"/>}
				aria-label={t.filters.searchInputPlaceholder}
			/>
			<Select
				placeholder={t.filters.byStatus}
				selectedKeys={[statusFilter]}
				onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
				className="w-full md:w-48"
				aria-label={t.filters.byStatus}
			>
				{Object.entries(adminStatusFilterOptions).map(([key, value]) => (
					<SelectItem key={key}>{value}</SelectItem>
				))}
			</Select>
		</div>
	)

	return (
		<>
			<AdminContainer
				actions={[
					{
						label: t.addPost,
						onClick: handleAddPostClick,
						variant: 'solid',
						buttonType: ActionTypes.CREATE,
					},
				]}
				filters={filters}
			>
				<UnifiedTable
					columns={columns}
					data={filteredPosts}
					renderCell={renderCells}
					isLoading={blogPostsLoading}
					ariaLabel={t.table.ariaLabel}
				/>
			</AdminContainer>

			<BlogPostModal
				isOpen={isModalOpen}
				onClose={onModalClose}
				onSubmit={handleSubmitPost}
				mode={blogPostForm.modalMode}
				categories={categories || []}
				categoriesLoading={categoriesLoading}
				blogPostForm={blogPostForm}
			/>

			<DeleteConfirmationModal
				isOpen={isDeleteOpen}
				onClose={onDeleteClose}
				onConfirm={handleDeleteConfirm}
				message={t.deletePostMessage}
				title={t.deletePost}
				isLoading={crudLoading}
			/>
		</>
	);
}