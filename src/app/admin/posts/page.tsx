'use client';

import React, {useState} from 'react';

import {Image} from '@heroui/image';

import {PhotoIcon} from '@heroicons/react/24/outline';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import {uploadClubAsset} from '@/utils/supabase/storage';

import {BlogPostModal} from '@/app/admin/posts/components/BlogPostModal';
import {getStatusBadge} from '@/app/admin/posts/components/StatusBadge';

import {AdminContainer, Choice, Dialog, Search, showToast, UnifiedTable} from '@/components';
import {adminStatusFilterOptions} from '@/constants';
import {ActionTypes, ModalMode} from '@/enums';
import {formatDateString} from '@/helpers';
import {
  useBlogPost,
  useBlogPostFiltering,
  useBlogPostForm,
  useFetchBlog,
  useFetchCategories,
  useFetchUsers,
} from '@/hooks';
import {Blog} from '@/types';

const t = translations.blogPosts;

export default function BlogPostsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {users} = useFetchUsers();

  const {data: categories} = useFetchCategories();

  const {data: blogPosts, loading: blogPostsLoading, refetch: refetchBlog} = useFetchBlog();
  const {createBlogPost, updateBlogPost, deleteBlogPost, loading: crudLoading} = useBlogPost();
  const blogPostForm = useBlogPostForm();
  const {filteredPosts, categoryLookupMap} = useBlogPostFiltering({
    blogPosts: blogPosts || [],
    searchTerm,
    statusFilter,
    categories: categories || [],
  });

  const blogPostModal = useModalWithItem<Blog>();
  const deleteModal = useModalWithItem<Blog>();
  const matchModal = useModal();

  // Event handlers
  const handleAddPostClick = () => {
    blogPostForm.openAddMode();
    blogPostModal.onOpen();
  };

  const handleEditPostClick = (post: Blog) => {
    blogPostForm.openEditMode(post);
    blogPostModal.onOpen();
  };

  const handleSubmitPost = async () => {
    const {valid, errors} = blogPostForm.validateForm();

    if (!valid) {
      errors.forEach((error) => showToast.danger(error));
      return;
    }

    let imageUrl = blogPostForm.formData.image_url;

    if (blogPostForm.imageFile) {
      blogPostForm.setUploadingImage(true);

      const timestamp = Date.now();
      const fileExtension = blogPostForm.imageFile.name.split('.').pop();
      const fileName = `${timestamp}.${fileExtension}`;
      const blogPostId = blogPostForm.selectedItem?.id || 'new';
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

    // Convert empty strings to null for nullable UUID fields
    const sanitizedData = {
      ...blogPostForm.formData,
      category_id: blogPostForm.formData.category_id || null,
      match_id: blogPostForm.formData.match_id || null,
      author_id: blogPostForm.formData.author_id || null,
      image_url: imageUrl || null,
      published_at: blogPostForm.formData.published_at || null,
    };

    try {
      if (blogPostForm.modalMode === ModalMode.EDIT && blogPostForm.selectedItem) {
        await updateBlogPost(blogPostForm.selectedItem.id, {
          id: blogPostForm.selectedItem.id,
          ...sanitizedData,
        });
      } else {
        await createBlogPost(sanitizedData);
      }
      await refetchBlog();
      blogPostModal.closeAndClear();
      blogPostForm.resetForm();
    } catch (error) {
      showToast.danger('Chyba při ukládání příspěvku na blog.');
    }
  };

  const handleDeletePostClick = (item: Blog) => {
    deleteModal.openWith(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.selectedItem) return;

    const success = await deleteBlogPost(deleteModal.selectedItem.id);
    if (success) {
      await refetchBlog();
      deleteModal.closeAndClear();
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
      key: 'actions',
      label: t.table.actions,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.UPDATE, onPress: handleEditPostClick, title: t.actions.editPost},
        {type: ActionTypes.DELETE, onPress: handleDeletePostClick, title: t.actions.deletePost},
      ],
    },
  ];

  const renderCells = (post: Blog, columnKey: string) => {
    switch (columnKey) {
      case 'image':
        return post.image_url ? (
          <div className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <Image
              src={post.image_url}
              alt={post.title}
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
            <PhotoIcon className="w-6 h-6 text-gray-400" />
          </div>
        );
      case 'title':
        return (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{post.title}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{post.slug}</div>
          </div>
        );
      case 'category':
        return (
          <div className="flex flex-wrap gap-1">
            {post.category_id !== null ? categoryLookupMap.get(post.category_id) || '-' : '-'}
          </div>
        );
      case 'author':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {users.find((user) => user.id === post.author_id)?.email || '-'}
            </span>
          </div>
        );
      case 'status':
        return getStatusBadge(post.status);
      case 'created_at':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {post.created_at ? formatDateString(post.created_at) : '-'}
            </span>
          </div>
        );
    }
  };

  const statusOptions = Object.entries(adminStatusFilterOptions).map((c) => ({
    key: c[0],
    label: c[1],
  }));

  const filters = (
    <div className="flex flex-col justify-between md:flex-row gap-4 w-full">
      <Search
        value={searchTerm}
        onChange={(value) => setSearchTerm(value)}
        placeholder={t.filters.searchInputPlaceholder}
        aria-label={t.filters.searchInputPlaceholder}
        className="w-full md:w-1/3"
      />
      <Choice
        placeholder={t.filters.byStatus}
        aria-label={t.filters.byStatus}
        className="w-full md:w-48"
        items={statusOptions}
        value={statusFilter}
        onChange={(id) => setStatusFilter(id ?? 'all')}
      />
    </div>
  );

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
        isOpen={blogPostModal.isOpen}
        onClose={blogPostModal.closeAndClear}
        onSubmit={handleSubmitPost}
        mode={blogPostForm.modalMode}
        categories={categories || []}
        blogPostForm={blogPostForm}
        users={users}
        matchModalControl={matchModal}
        isLoading={crudLoading}
      />

      <Dialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeAndClear}
        onSubmit={handleDeleteConfirm}
        title={t.deletePost}
        size={'md'}
        isLoading={crudLoading}
        dangerAction
        submitButtonLabel={translations.common.actions.delete}
      >
        {t.deletePostMessage}
      </Dialog>
    </>
  );
}
