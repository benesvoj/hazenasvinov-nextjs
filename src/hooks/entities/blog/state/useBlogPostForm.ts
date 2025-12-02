'use client';

import React, {useCallback, useState} from 'react';

import {generateSlug} from '@/utils/slugGenerator';

import {showToast} from '@/components';
import {BLOG_POST_STATUSES} from '@/enums';
import {createFormHook} from '@/hooks';
import {translations} from '@/lib';
import {Blog, BlogPostFormData, Match} from '@/types';

const initialFormData: BlogPostFormData = {
  title: '',
  slug: '',
  content: '',
  status: BLOG_POST_STATUSES.draft,
  category_id: '',
  match_id: '',
  image_url: '',
  author_id: '',
  published_at: '',
};
const t = translations.admin.blog.responseMessages;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const useBlogPostBaseForm = createFormHook<Blog, BlogPostFormData>({
  initialFormData,
  validationRules: [
    {field: 'title', message: t.mandatoryTitle},
    {field: 'content', message: t.mandatoryContent},
  ],
  excludeFields: [
    'id',
    'created_at',
    'updated_at',
    'created_by',
    'searchableContent',
    'searchableTitle',
  ],
});

export const useBlogPostForm = () => {
  const baseForm = useBlogPostBaseForm();

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  const updateFormData = useCallback(
    (updates: Partial<BlogPostFormData>) => {
      const newData = {...updates};
      if (updates.title !== undefined) {
        newData.slug = generateSlug(updates.title);
      }
      baseForm.updateFormData(newData);
    },
    [baseForm]
  );

  const resetForm = useCallback(() => {
    baseForm.resetForm();
    setSelectedMatch(null);
    setImageFile(null);
    setImagePreview('');
    setUploadingImage(false);
  }, [baseForm]);

  const handleMatchSelect = useCallback(
    (match: Match | null) => {
      setSelectedMatch(match);
      updateFormData({match_id: match?.id || ''});
    },
    [updateFormData]
  );

  const handleImageFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.warning('Selected file is not an image.');
      console.error('Selected file is not an image.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast.warning('Selected image exceeds the maximum size of 5MB.');
      console.error('Selected image exceeds the maximum size of 5MB.');
      return;
    }
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImageFile(null);
    setImagePreview('');
    updateFormData({image_url: ''});
  }, [updateFormData]);

  return {
    ...baseForm,

    updateFormData,
    resetForm,

    selectedMatch,
    handleMatchSelect,

    imageFile,
    imagePreview,
    handleImageFileChange,
    handleRemoveImage,
    uploadingImage,
    setUploadingImage,
  };
};
