'use client';

import {useState} from 'react';

import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';
import {useModalWithItem} from '@/hooks';

import type {RecordingSchema} from '../types';
import {transformToRecordingInsert} from '../utils';

import {useRecordingFilter, useRecordingForm, useRecordings, useRecordingsCrud} from './';

export function useCoachRecordingsPageLogic() {
  const [currentPage, setCurrentPage] = useState(1);
  const [crudLoading, setCrudLoading] = useState(false);

  const {availableCategories} = useCoachCategory();

  const {
    data: recordings,
    loading,
    refetch,
  } = useRecordings({
    categoryIds: availableCategories.map((c) => c.id),
  });

  const {filters, setFilters, paginatedRecordings, totalPages, totalCount} = useRecordingFilter({
    recordings,
    itemsPerPage: 20,
    currentPage,
  });

  const {update} = useRecordingsCrud();
  const form = useRecordingForm();
  const formModal = useModalWithItem<RecordingSchema>();

  const handleEdit = (item: RecordingSchema) => {
    form.openEditMode(item);
    formModal.onOpen();
  };

  const handleFormSubmit = async () => {
    const {valid} = form.validateForm();
    if (!valid) return;

    if (!form.selectedItem) return;

    try {
      setCrudLoading(true);
      await update(form.selectedItem.id, transformToRecordingInsert(form.formData));
      await refetch();
      formModal.closeAndClear();
      form.resetForm();
    } finally {
      setCrudLoading(false);
    }
  };

  return {
    availableCategories,
    loading,
    crudLoading,
    recordings: paginatedRecordings,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
    form,
    formModal,
    handleEdit,
    handleFormSubmit,
  };
}
