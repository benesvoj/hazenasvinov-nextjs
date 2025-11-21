'use client';

import React, {useState, useEffect, useCallback} from 'react';

import {VideoCameraIcon} from '@heroicons/react/24/outline';

import {useAppData} from '@/contexts/AppDataContext';

import {DeleteConfirmationModal, PageContainer, VideoPageLayout} from '@/components';
import {useAuth, useFetchVideos, useUserRoles, useVideoFiltering, useVideos} from '@/hooks';
import {Video, VideoFormData} from '@/types';
import {transformToVideoInsert} from '@/utils';

export default function CoachesVideosPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [assignedCategories, setAssignedCategories] = useState<string[]>([]);

  const {
    categories: {data: categories},
    clubs: {data: clubs},
    seasons: {data: seasons},
  } = useAppData();

  const {user, loading: authLoading} = useAuth();
  const {getCurrentUserCategories} = useUserRoles();

  const {data: videos, loading, error, refetch: fetchVideos} = useFetchVideos();
  const {createVideo, updateVideo, deleteVideo} = useVideos();
  const {filters, setFilters, paginatedVideos, totalPages, totalCount} = useVideoFiltering({
    videos,
    itemsPerPage,
    currentPage,
  });

  // Fetch coach's assigned category using new role system
  const fetchAssignedCategories = useCallback(async () => {
    if (!user?.id) return;

    try {
      const categories = await getCurrentUserCategories();
      setAssignedCategories(categories);
    } catch (err) {
      console.error('Error fetching assigned category:', err);
      setAssignedCategories([]);
    }
  }, [user?.id, getCurrentUserCategories]);

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchAssignedCategories();
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [user?.id, authLoading]); // Remove fetchAssignedCategories from dependencies

  // Handle video operations
  const handleCreateVideo = async (formData: VideoFormData) => {
    const videoData = transformToVideoInsert(formData);

    try {
      await createVideo(videoData);
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error creating video:', err);
    }
  };

  const handleUpdateVideo = async (formData: VideoFormData) => {
    if (!editingVideo) return;

    try {
      await updateVideo(editingVideo.id, formData);
      setEditingVideo(null);
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error updating video:', err);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      setDeleteModalOpen(false);
      setVideoToDelete(null);
    } catch (err) {
      console.error('Error deleting video:', err);
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

  // Filter category to only show assigned ones
  const availableCategories = categories.filter((cat) => assignedCategories.includes(cat.id));

  // Access control message
  const accessControlMessage =
    assignedCategories.length === 0 ? (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <VideoCameraIcon className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h3 className="font-medium text-yellow-900">Žádné přiřazené kategorie</h3>
          <p className="text-sm text-yellow-700">
            Nemáte přiřazené žádné kategorie. Kontaktujte administrátora pro přiřazení kategorií.
          </p>
        </div>
      </div>
    ) : null;

  // Additional info for header
  const additionalInfo =
    assignedCategories.length > 0 ? (
      <p className="text-sm text-gray-500">
        Máte přístup k {availableCategories.length} kategoriím
      </p>
    ) : null;

  if (authLoading || (loading && videos.length === 0)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Videa</h1>
            <p className="text-gray-600">Správa videí pro vaše kategorie</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageContainer>
        <VideoPageLayout
          // Header props
          onAddVideo={openCreateModal}
          // Data props
          videos={videos}
          loading={loading}
          error={error}
          categories={categories}
          clubs={clubs}
          seasons={seasons}
          availableCategories={availableCategories}
          // Event handlers
          onFiltersChange={setFilters}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onFormSubmit={handleFormSubmit}
          // Modal props
          isFormModalOpen={isFormModalOpen}
          editingVideo={editingVideo}
          onCloseModals={closeModals}
          // Access control
          showAccessControlMessage={assignedCategories.length === 0}
          accessControlMessage={accessControlMessage}
          // Empty state customization
          emptyStateTitle="Žádná videa"
          emptyStateDescription={
            filters.search || filters.category_id || filters.is_active !== undefined
              ? 'Nebyla nalezena žádná videa odpovídající filtru.'
              : 'Zatím nejsou přidána žádná videa pro vaše kategorie.'
          }
          showAddButton={!filters.search && !filters.category_id && filters.is_active === undefined}
          // Pagination props
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
        />
      </PageContainer>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeModals}
        onConfirm={() => videoToDelete && handleDeleteVideo(videoToDelete.id)}
        title="Smazat video"
        message={`Opravdu chcete smazat video "${videoToDelete?.title}"? Tato akce je nevratná.`}
      />
    </>
  );
}
