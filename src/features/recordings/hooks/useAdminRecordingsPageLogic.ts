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

  const modals = {
    form: useModalWithItem<RecordingSchema>(),
    delete: useModalWithItem<RecordingSchema>(),
  };

  const handleAdd = () => {
    form.openAddMode();
    modals.form.onOpen();
  };

  const handleEdit = (item: RecordingSchema) => {
    form.openEditMode(item);
    modals.form.onOpen();
  };

  const handleDeleteClick = (item: RecordingSchema) => {
    modals.delete.openWith(item);
  };

  const handleFormSubmit = useCallback(async () => {
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
      modals.form.closeAndClear();
      form.resetForm();
    } finally {
      setCrudLoading(false);
    }
  }, [form.formData, form.modalMode, form.selectedItem]);

  const handleDelete = useCallback(async () => {
    if (!modals.delete.selectedItem) return;

    setCrudLoading(true);
    await deleteItem(modals.delete.selectedItem.id);
    await refetch();
    modals.delete.closeAndClear();
    setCrudLoading(false);
  }, [modals.delete]);

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
    modals,
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
