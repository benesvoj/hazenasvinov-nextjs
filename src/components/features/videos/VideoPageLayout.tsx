'use client';

import React from 'react';

import {Card, CardBody} from '@heroui/react';

import {Video, VideoFilters as VideoFiltersType, Category, Club, Season} from '@/types';

import {VideoFilters} from './VideoFilters';
import {VideoFormModal} from './VideoFormModal';
import {VideoGrid} from './VideoGrid';
interface VideoPageLayoutProps {
  // Header props
  onAddVideo: () => void;

  // Data props
  videos: Video[];
  loading: boolean;
  error: string | null;
  filters: VideoFiltersType;
  categories: Category[];
  clubs: Club[];
  seasons: Season[];
  availableCategories?: Category[]; // For coaches - only show assigned category

  // Event handlers
  onFiltersChange: (filters: VideoFiltersType) => void;
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onFormSubmit: (formData: any) => void;

  // Modal props
  isFormModalOpen: boolean;
  editingVideo: Video | null;
  onCloseModals: () => void;

  // Access control
  showAccessControlMessage?: boolean;
  accessControlMessage?: React.ReactNode;

  // Empty state customization
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showAddButton?: boolean;

  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  isHeaderVisible?: boolean;
}

export function VideoPageLayout({
  // Header props
  onAddVideo,

  // Data props
  videos,
  loading,
  error,
  filters,
  categories,
  clubs,
  seasons,
  availableCategories,

  // Event handlers
  onFiltersChange,
  onEdit,
  onDelete,
  onFormSubmit,

  // Modal props
  isFormModalOpen,
  editingVideo,
  onCloseModals,

  // Access control
  showAccessControlMessage = false,
  accessControlMessage,

  // Empty state customization
  emptyStateTitle,
  emptyStateDescription,
  showAddButton = true,

  // Pagination props
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  itemsPerPage = 20,
  onPageChange,
}: VideoPageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Access Control Message */}
      {showAccessControlMessage && accessControlMessage && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardBody>{accessControlMessage}</CardBody>
        </Card>
      )}

      {/* Filters */}
      <VideoFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        categories={categories}
        clubs={clubs}
        seasons={seasons}
        availableCategories={availableCategories}
      />

      {/* Videos Grid */}
      <VideoGrid
        videos={videos}
        loading={loading}
        filters={filters}
        categories={availableCategories || categories}
        seasons={seasons}
        onEdit={onEdit}
        onDelete={onDelete}
        onAddVideo={onAddVideo}
        emptyStateTitle={emptyStateTitle}
        emptyStateDescription={emptyStateDescription}
        showAddButton={showAddButton}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />

      {/* Form Modal */}
      <VideoFormModal
        isOpen={isFormModalOpen}
        onClose={onCloseModals}
        onSubmit={onFormSubmit}
        video={editingVideo}
        clubs={clubs}
        availableCategories={availableCategories}
      />
    </div>
  );
}
