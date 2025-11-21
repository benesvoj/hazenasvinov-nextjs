'use client';

import React from 'react';

import {Card, CardBody} from '@heroui/react';

import {
  Category,
  Club,
  Season,
  Video,
  VideoFilters as VideoFiltersType,
  VideoSchema,
} from '@/types';

import {VideoGrid} from './VideoGrid';

interface VideoPageLayoutProps {
  // Header props
  onAddVideo: () => void;

  // Data props
  videos: VideoSchema[];
  loading: boolean;
  error: string | null;
  categories: Category[];
  clubs: Club[];
  seasons: Season[];
  availableCategories?: Category[]; // For coaches - only show assigned category

  // Event handlers
  onFiltersChange: (filters: VideoFiltersType) => void;
  onEdit: (video: VideoSchema) => void;
  onDelete: (video: VideoSchema) => void;
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
  videos,
  loading,
  categories,
  seasons,
  clubs,
  availableCategories,

  // Event handlers
  onEdit,
  onDelete,

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

      <VideoGrid
        videos={videos}
        loading={loading}
        categories={availableCategories || categories}
        seasons={seasons}
        clubs={clubs}
        onEdit={onEdit}
        onDelete={onDelete}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  );
}
