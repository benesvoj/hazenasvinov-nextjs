'use client';

import React, {useState, useEffect} from 'react';
import {Video, VideoFormData, VideoFilters} from '@/types';
import {useVideos} from '@/hooks/entities/video/useVideos';
import {useAppData} from '@/contexts/AppDataContext';
import {VideoCameraIcon} from '@heroicons/react/24/outline';
import {DeleteConfirmationModal, VideoPageLayout} from '@/components';
import {AdminContainer} from '../../../components/admin/AdminContainer';
import {translations} from '@/lib/translations';
import {Button} from '@heroui/react';
import {PlusIcon} from '@heroicons/react/24/outline';

export default function VideosPage() {
  const [filters, setFilters] = useState<VideoFilters>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);

  // Use AppDataContext for common data
  const {categories, clubs, seasons, categoriesLoading, clubsLoading, seasonsLoading} =
    useAppData();

  const {
    videos,
    loading,
    error,
    setError,
    fetchVideos,
    createVideo,
    updateVideo,
    deleteVideo,
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    goToPage,
  } = useVideos({enableAccessControl: false, itemsPerPage: 20});

  const t = translations.admin.videos;

  // Fetch videos when filters change
  useEffect(() => {
    fetchVideos(filters);
  }, [filters]); // Remove fetchVideos from dependencies to prevent infinite loop

  // Categories, clubs, and seasons are now provided by AppDataContext
  // No need for individual fetching

  // Handle video operations
  const handleCreateVideo = async (formData: VideoFormData) => {
    try {
      await createVideo(formData);
      setIsFormModalOpen(false);
    } catch (err: any) {
      setError(`Chyba při vytváření videa: ${err?.message || 'Neznámá chyba'}`);
    }
  };

  const handleUpdateVideo = async (formData: VideoFormData) => {
    if (!editingVideo) return;

    try {
      await updateVideo(editingVideo.id, formData);
      setEditingVideo(null);
      setIsFormModalOpen(false);
    } catch (err: any) {
      setError(`Chyba při aktualizaci videa: ${err?.message || 'Neznámá chyba'}`);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      setDeleteModalOpen(false);
      setVideoToDelete(null);
    } catch (err: any) {
      console.error('Error deleting video:', err);
      setError(`Chyba při mazání videa: ${err?.message || 'Neznámá chyba'}`);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setEditingVideo(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (video: Video) => {
    setVideoToDelete(video);
    setDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setEditingVideo(null);
    setDeleteModalOpen(false);
    setVideoToDelete(null);
  };

  const handleFormSubmit = editingVideo ? handleUpdateVideo : handleCreateVideo;

  // Handle page change
  const handlePageChange = (page: number) => {
    goToPage(page);
    fetchVideos(filters, page);
  };

  return (
    <AdminContainer
      title={t.title}
      description={t.description}
      icon={<VideoCameraIcon className="w-8 h-8 text-blue-600" />}
      actions={
        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={openCreateModal}
        >
          {t.addVideo}
        </Button>
      }
    >
      {/* TODO: Remove header props after migration */}
      <VideoPageLayout
        // Header props
        title="Videa"
        description="Správa videí pro jednotlivé kategorie"
        iconColor="text-blue-600"
        buttonColor="primary"
        buttonText={t.addVideo}
        onAddVideo={openCreateModal}
        isAddDisabled={false}
        isHeaderVisible={false}
        // Data props
        videos={videos}
        loading={loading}
        error={error}
        filters={filters}
        categories={categories}
        clubs={clubs}
        seasons={seasons}
        // Event handlers
        onFiltersChange={setFilters}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        onFormSubmit={handleFormSubmit}
        // Modal props
        isFormModalOpen={isFormModalOpen}
        editingVideo={editingVideo}
        onCloseModals={closeModals}
        // Empty state customization
        emptyStateTitle="Žádná videa"
        emptyStateDescription={
          filters.search || filters.category_id || filters.is_active !== undefined
            ? 'Nebyla nalezena žádná videa odpovídající filtru.'
            : 'Zatím nejsou přidána žádná videa.'
        }
        showAddButton={!filters.search && !filters.category_id && filters.is_active === undefined}
        // Pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeModals}
        onConfirm={() => videoToDelete && handleDeleteVideo(videoToDelete.id)}
        title={t.deleteModal.title}
        message={t.deleteModal.description}
      />
    </AdminContainer>
  );
}
