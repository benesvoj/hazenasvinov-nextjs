'use client';

import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {useVideos} from '@/hooks/entities/video/state/useVideos';

import {useAppData} from '@/contexts/AppDataContext';

import {
  AdminContainer,
  DeleteConfirmationModal,
  VideoFilters as VideoFiltersComponent,
  VideoFormModal,
  VideoGrid,
} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useCustomModal, useFetchVideos, useVideoFiltering, useVideoForm} from '@/hooks';
import {translations} from '@/lib';
import {VideoSchema} from '@/types';
import {transformToVideoInsert} from '@/utils';

const t = translations.admin.videos;

export default function VideosPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    categories: {data: categories},
    clubs: {data: clubs},
    seasons: {data: seasons},
  } = useAppData();
  const {data: allVideos, loading: fetchLoading, refetch} = useFetchVideos();
  const {createVideo, updateVideo, deleteVideo, loading: crudLoading} = useVideos();
  const {
    formData,
    setFormData,
    modalMode,
    validateForm,
    selectedItem,
    resetForm,
    openAddMode,
    openEditMode,
  } = useVideoForm();

  const {filters, setFilters, paginatedVideos, totalPages, totalCount} = useVideoFiltering({
    videos: allVideos,
    itemsPerPage,
    currentPage,
  });

  const videoFormModal = useCustomModal();
  const deleteModal = useCustomModal();

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const openAddModal = useCallback(() => {
    openAddMode();
    videoFormModal.onOpen();
  }, [openAddMode, videoFormModal]);

  const openEditModal = useCallback(
    (item: VideoSchema) => {
      openEditMode(item);
      videoFormModal.onOpen();
    },
    [openEditMode, videoFormModal]
  );

  const openDeleteModal = useCallback(
    (item: VideoSchema) => {
      openEditMode(item);
      deleteModal.onOpen();
    },
    [openEditMode, deleteModal]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (selectedItem) {
      await deleteVideo(selectedItem.id);
      await refetch();
      deleteModal.onClose();
      resetForm();
    }
  }, [selectedItem, deleteVideo, refetch, deleteModal, resetForm]);

  const handleFormSubmit = useCallback(async () => {
    const {valid, errors} = validateForm();

    if (!valid) {
      console.error('Validation errors', errors);
      return;
    }

    try {
      const videoData = transformToVideoInsert(formData);

      if (modalMode === ModalMode.EDIT && selectedItem) {
        await updateVideo(selectedItem.id, videoData);
      } else {
        await createVideo(videoData);
      }
      await refetch();
      videoFormModal.onClose();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  }, [
    validateForm,
    formData,
    modalMode,
    selectedItem,
    updateVideo,
    createVideo,
    refetch,
    videoFormModal,
    resetForm,
  ]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const videoFilters = useMemo(
    () => (
      <VideoFiltersComponent
        filters={filters}
        categories={categories}
        clubs={clubs}
        seasons={seasons}
        onFiltersChange={setFilters}
      />
    ),
    [filters, categories, clubs, seasons, setFilters]
  );

  return (
    <>
      <AdminContainer
        actions={[
          {
            label: t.addVideo,
            onClick: openAddModal,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
        filters={videoFilters}
      >
        <VideoGrid
          videos={paginatedVideos}
          loading={fetchLoading}
          categories={categories}
          seasons={seasons}
          clubs={clubs}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      </AdminContainer>

      <VideoFormModal
        isOpen={videoFormModal.isOpen}
        onClose={videoFormModal.onClose}
        onSubmit={handleFormSubmit}
        formData={formData}
        setFormData={setFormData}
        mode={modalMode}
        clubs={clubs}
        categories={categories}
        seasons={seasons}
        isLoading={crudLoading}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleConfirmDelete}
        title={t.deleteModal.title}
        message={t.deleteModal.description}
        isLoading={crudLoading}
      />
    </>
  );
}
