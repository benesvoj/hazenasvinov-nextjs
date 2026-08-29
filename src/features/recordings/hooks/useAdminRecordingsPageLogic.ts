'use client';

import {useCallback, useState} from 'react';

import {ModalMode} from '@/enums';
import {useModalWithItem} from '@/hooks';

import {useRecordingFilter, useRecordingForm, useRecordings, useRecordingsCrud} from '../hooks';
import type {RecordingSchema} from '../types';
import {transformToRecordingInsert} from '../utils';

type FiltersType = ReturnType<typeof useRecordingFilter>['filters'];

export function useAdminRecordingsPageLogic() {
  const [crudLoading, setCrudLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const {data: recordings, loading, refetch} = useRecordings();
  const {create, update, deleteItem} = useRecordingsCrud();

  const form = useRecordingForm();
  const filters = useRecordingFilter({
    recordings,
    itemsPerPage: 20,
    currentPage,
  });

  const formModal = useModalWithItem<RecordingSchema>();
  const deleteModal = useModalWithItem<RecordingSchema>();

  const handleAdd = () => {
    form.openAddMode();
    formModal.onOpen();
  };

  const handleEdit = (item: RecordingSchema) => {
    form.openEditMode(item);
    formModal.onOpen();
  };

  const handleDeleteClick = (item: RecordingSchema) => {
    deleteModal.openWith(item);
  };

  const handleFormSubmit = async () => {
    const {valid} = form.validateForm();
    if (!valid) return;

    try {
      const videoData = transformToRecordingInsert(form.formData);
      setCrudLoading(true);

      if (form.modalMode === ModalMode.EDIT && form.selectedItem) {
        await update(form.selectedItem.id, videoData);
      } else {
        await create(videoData);
      }

      await refetch();
      formModal.closeAndClear();
      form.resetForm();
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.selectedItem) return;

    setCrudLoading(true);
    await deleteItem(deleteModal.selectedItem.id);
    await refetch();
    deleteModal.closeAndClear();
    setCrudLoading(false);
  };

  const handleFiltersChange = (newFilters: FiltersType) => {
    filters.setFilters(newFilters);
    setCurrentPage(1);
  };

  return {
    recordings,
    loading,
    crudLoading,
    currentPage,
    setCurrentPage,
    form,
    filters,
    formModal,
    deleteModal,
    refetch,
    create,
    update,
    deleteItem,
    handleAdd,
    handleEdit,
    handleDeleteClick,
    handleFormSubmit,
    handleDelete,
    handleFiltersChange,
  };
}
