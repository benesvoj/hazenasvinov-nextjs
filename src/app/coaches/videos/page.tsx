'use client';

import React, { useState, useEffect } from 'react';
import { Video, VideoFormData, VideoFilters } from '@/types';
import { useClubs, useSeasons, useAuth, useCategories, useUserRoles } from '@/hooks';
import { useVideos } from '@/hooks/useVideos';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { DeleteConfirmationModal, VideoPageLayout } from '@/components';


export default function CoachesVideosPage() {
  const [filters, setFilters] = useState<VideoFilters>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [assignedCategories, setAssignedCategories] = useState<string[]>([]);

  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const { clubs, loading: clubsLoading } = useClubs();
  const { seasons, loading: seasonsLoading, fetchAllSeasons } = useSeasons();
  const { user, loading: authLoading } = useAuth();
  const { getCurrentUserCategories } = useUserRoles();

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
  } = useVideos({ 
    assignedCategories, 
    enableAccessControl: true,
    itemsPerPage: 20
  });

  // Fetch coach's assigned categories using new role system
  const fetchAssignedCategories = async () => {
    if (!user?.id) return;

    try {
      const categories = await getCurrentUserCategories();
      setAssignedCategories(categories);
    } catch (err) {
      console.error('Error fetching assigned categories:', err);
      setAssignedCategories([]);
    }
  };

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchAssignedCategories();
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (assignedCategories.length > 0) {
      fetchCategories();
      fetchAllSeasons();
    }
  }, [assignedCategories]);

  // Fetch videos when filters or assigned categories change
  useEffect(() => {
    if (assignedCategories.length > 0) {
      fetchVideos(filters);
    }
  }, [filters, assignedCategories]);

  // Handle video operations
  const handleCreateVideo = async (formData: VideoFormData) => {
    try {
      await createVideo(formData);
      setIsFormModalOpen(false);
    } catch (err) {
      console.error('Error creating video:', err);
      setError('Chyba při vytváření videa');
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
      setError('Chyba při aktualizaci videa');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteVideo(id);
      setDeleteModalOpen(false);
      setVideoToDelete(null);
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Chyba při mazání videa');
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

  // Filter categories to only show assigned ones
  const availableCategories = categories.filter(cat => 
    assignedCategories.includes(cat.id)
  );

  // Access control message
  const accessControlMessage = assignedCategories.length === 0 ? (
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
  const additionalInfo = assignedCategories.length > 0 ? (
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
    <div className="space-y-6">
      <VideoPageLayout
        // Header props
        title="Videa"
        description="Správa videí pro vaše kategorie"
        iconColor="text-green-600"
        buttonColor="success"
        buttonText="Přidat video"
        onAddVideo={openCreateModal}
        isAddDisabled={assignedCategories.length === 0}

        // Data props
        videos={videos}
        loading={loading}
        error={error}
        filters={filters}
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
        onPageChange={handlePageChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeModals}
        onConfirm={() => videoToDelete && handleDeleteVideo(videoToDelete.id)}
        title="Smazat video"
        message={`Opravdu chcete smazat video "${videoToDelete?.title}"? Tato akce je nevratná.`}
      />
    </div>
  );
}
