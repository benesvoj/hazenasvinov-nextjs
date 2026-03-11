import React from 'react';

import Image from 'next/image';

import {Button, Input, Textarea} from '@heroui/react';

import {MagnifyingGlassIcon, PhotoIcon, XMarkIcon} from '@heroicons/react/24/outline';

import {useModal} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import MatchSelectionModal from '@/app/admin/posts/components/MatchSelectionModal';

import {Choice, Dialog} from '@/components';
import {BlogPostStatuses, getBlogPostStatusOptions, ModalMode} from '@/enums';
import {formatDateString} from '@/helpers';
import {useBlogPostForm} from '@/hooks';
import {Category, SupabaseUser} from '@/types';

interface BlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  categories: Category[];
  blogPostForm: ReturnType<typeof useBlogPostForm>;
  mode: ModalMode;
  users: SupabaseUser[];
  matchModalControl: ReturnType<typeof useModal>;
  isLoading?: boolean;
}

export const BlogPostModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories,
  blogPostForm,
  mode,
  users,
  matchModalControl,
  isLoading,
}: BlogPostModalProps) => {
  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? 'Upravit článek' : 'Vytvořit nový článek';
  const submitButtonLabel = isEditMode
    ? translations.common.actions.save
    : translations.common.actions.create;

  const authorOptions = users.map((user) => ({key: user.id, label: user.email}));
  const statusOptions = getBlogPostStatusOptions().map((status) => ({
    key: status.value,
    label: status.label,
  }));
  const categoriesOptions = categories.map((category) => ({
    key: category.id,
    label: category.name,
  }));

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={modalTitle}
        onSubmit={onSubmit}
        isLoading={isLoading}
        submitButtonLabel={submitButtonLabel}
        size={'3xl'}
      >
        <div className={'grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4'}>
          <div className="space-y-2 md:space-y-4">
            <Input
              label={translations.blogPosts.labels.title}
              placeholder={translations.blogPosts.placeholders.title}
              value={blogPostForm.formData.title}
              onChange={(e) =>
                blogPostForm.updateFormData({...blogPostForm.formData, title: e.target.value})
              }
              isRequired
              size="sm"
            />
            <Input
              label={translations.blogPosts.labels.slug}
              placeholder={translations.blogPosts.placeholders.slug}
              value={blogPostForm.formData.slug}
              onChange={(e) =>
                blogPostForm.setFormData({...blogPostForm.formData, slug: e.target.value})
              }
              isRequired
              isDisabled
              size="sm"
            />
            <Choice
              items={authorOptions}
              value={blogPostForm.formData.author_id}
              onChange={(id) => blogPostForm.setFormData({...blogPostForm.formData, author_id: id})}
              label={translations.blogPosts.labels.author}
              placeholder={translations.blogPosts.placeholders.author}
              isRequired
            />
            <Choice
              items={statusOptions}
              value={blogPostForm.formData.status}
              onChange={(value) =>
                blogPostForm.setFormData({
                  ...blogPostForm.formData,
                  status: value ?? BlogPostStatuses.DRAFT,
                })
              }
              label={translations.blogPosts.labels.status}
              placeholder={translations.blogPosts.placeholders.status}
              isRequired
            />

            <Choice
              items={categoriesOptions}
              value={blogPostForm.formData.category_id}
              onChange={(id) =>
                blogPostForm.setFormData({...blogPostForm.formData, category_id: id})
              }
              label={translations.categories.labels.category}
              placeholder={translations.categories.placeholders.category}
            />

            {/* Match Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Související zápas (volitelné)
              </label>
              {blogPostForm.selectedMatch ? (
                <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {blogPostForm.selectedMatch.home_team.name} vs{' '}
                        {blogPostForm.selectedMatch.away_team.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {blogPostForm.selectedMatch.competition} •{' '}
                        {formatDateString(blogPostForm.selectedMatch.date)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => blogPostForm.handleMatchSelect(null)}
                    >
                      Odstranit
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="bordered"
                  startContent={<MagnifyingGlassIcon className="w-4 h-4" />}
                  onPress={matchModalControl.onOpen}
                  className="w-full justify-start"
                >
                  Vybrat zápas
                </Button>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {!blogPostForm.formData.category_id
                  ? 'Nejprve vyberte kategorii pro filtrování dostupných zápasů.'
                  : 'Vyberte zápas pro propojení s článkem'}
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Obrázek článku
              </label>

              {blogPostForm.imagePreview ? (
                <div className="space-y-3">
                  <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                    <Image
                      src={blogPostForm.imagePreview}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="object-cover"
                    />
                    <Button
                      onPress={blogPostForm.handleRemoveImage}
                      className="absolute top-2 right-2"
                      title="Odstranit obrázek"
                      radius="full"
                      size="sm"
                      color="danger"
                      variant="flat"
                      isIconOnly
                      aria-label="Odstranit obrázek"
                      startContent={<XMarkIcon className="h-4 w-4" />}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {blogPostForm.imageFile
                      ? 'Obrázek bude nahrán při uložení článku'
                      : 'Stávající obrázek bude zachován, pokud nevyberete nový soubor.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                          Nahrajte obrázek
                        </span>
                        <span className="text-gray-500"> nebo přetáhněte</span>
                      </label>
                      <input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={blogPostForm.handleImageFileChange}
                        disabled={blogPostForm.uploadingImage}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF do 5MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <Textarea
              label={translations.blogPosts.labels.content}
              placeholder={translations.blogPosts.placeholders.content}
              value={blogPostForm.formData.content}
              onChange={(e) =>
                blogPostForm.setFormData({
                  ...blogPostForm.formData,
                  content: e.target.value,
                })
              }
              minRows={40}
              isRequired
            />
          </div>
        </div>
      </Dialog>

      <MatchSelectionModal
        isOpen={matchModalControl.isOpen}
        onClose={matchModalControl.onClose}
        onSelect={blogPostForm.handleMatchSelect}
        selectedMatchId={blogPostForm.selectedMatch?.id}
        categoryId={blogPostForm.formData.category_id || undefined}
      />
    </>
  );
};
