'use client';

import React, {useState} from 'react';

import {
  Card,
  CardBody,
  Button,
  Input,
  useDisclosure,
  Select,
  SelectItem,
  Image,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';

import {PlusIcon, PencilIcon, TrashIcon, TagIcon, PhotoIcon} from '@heroicons/react/24/outline';

import {useBlogPosts} from '@/hooks/entities/blog/useBlogPosts';

import {translations} from '@/lib/translations';

import {LoadingSpinner, AdminContainer, DeleteConfirmationModal} from '@/components';
import {adminStatusFilterOptions} from '@/constants';
import {ButtonTypes} from '@/enums';
import {formatDateString} from '@/helpers';
import {BlogPost} from '@/types';

import {AddPostModal, EditPostModal} from './components';

export default function BlogPostsPage() {
  const t = translations.admin.posts;

  // Use the custom hook for all business logic
  const {
    posts,
    users,
    categories,
    loading,
    categoriesLoading,
    userError,
    dbError,
    categoriesError,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredPosts,
    categoryLookupMap,
    addPost: handleAddPost,
    updatePost: handleUpdatePost,
    deletePost: handleDeletePost,
  } = useBlogPosts();

  const {isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose} = useDisclosure();
  const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose} = useDisclosure();
  const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Event handlers
  const handleAddPostClick = () => {
    onAddOpen();
  };

  const handleEditPostClick = (post: BlogPost) => {
    setSelectedPost(post);
    onEditOpen();
  };

  const handleDeletePostClick = (post: BlogPost) => {
    setSelectedPost(post);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (selectedPost) {
      await handleDeletePost(selectedPost.id);
      setSelectedPost(null);
      onDeleteClose();
    }
  };

  const handleUpdatePostWrapper = async (
    formData: Omit<BlogPost, 'id' | 'updated_at' | 'created_at'>,
    imageFile: File | null
  ) => {
    if (!selectedPost) return;
    await handleUpdatePost({...formData, id: selectedPost.id} as BlogPost, imageFile);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Chip color="success" variant="flat">
            {adminStatusFilterOptions.published}
          </Chip>
        );
      case 'draft':
        return (
          <Chip color="warning" variant="flat">
            {adminStatusFilterOptions.draft}
          </Chip>
        );
      case 'archived':
        return (
          <Chip color="secondary" variant="flat">
            {adminStatusFilterOptions.archived}
          </Chip>
        );
      default:
        return null;
    }
  };

  return (
    <AdminContainer
      actions={[
        {
          label: t.addPost,
          onClick: handleAddPostClick,
          variant: 'solid',
          buttonType: ButtonTypes.CREATE,
        },
      ]}
    >
      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Hledat v článcích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              startContent={<TagIcon className="w-4 h-4 text-gray-400" />}
            />
            <Select
              placeholder="Filtr podle stavu"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              {Object.entries(adminStatusFilterOptions).map(([key, value]) => (
                <SelectItem key={key}>{value}</SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardBody className="p-0">
          {loading || categoriesLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableColumn>Obrázek</TableColumn>
                  <TableColumn>Název</TableColumn>
                  <TableColumn>Kategorie</TableColumn>
                  <TableColumn>Autor</TableColumn>
                  <TableColumn>Stav</TableColumn>
                  <TableColumn>Vytvořeno</TableColumn>
                  <TableColumn>Akce</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        {post.image_url ? (
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
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {post.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.category_id !== null
                            ? categoryLookupMap.get(post.category_id) || '-'
                            : '-'}
                        </div>
                      </TableCell>
                      {/* TODO: add author name instead of ID */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {post.author_id === 'default-user' ? 'Admin' : `ID: ${post.author_id}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatDateString(post.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            isIconOnly
                            onPress={() => handleEditPostClick(post)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => handleDeletePostClick(post)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    {dbError || categoriesError ? 'Chyba databáze' : 'Žádné články'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-500">
                    {dbError || categoriesError
                      ? 'Nelze načíst články kvůli chybě databáze. Zkontrolujte konfiguraci Supabase.'
                      : searchTerm || statusFilter !== 'all'
                        ? 'Pro vybrané filtry nebyly nalezeny žádné články.'
                        : 'Zatím nebyly vytvořeny žádné články.'}
                  </p>
                  {(dbError || categoriesError) && (
                    <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        <strong>Detaily chyby:</strong> {dbError || categoriesError}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Add Post Modal */}
      <AddPostModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        onSubmit={handleAddPost}
        users={users}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        onSubmit={handleUpdatePostWrapper}
        post={selectedPost}
        users={users}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteConfirm}
        message={t.deletePostMessage}
        title={t.deletePost}
      />
    </AdminContainer>
  );
}
