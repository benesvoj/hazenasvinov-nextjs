"use client";

import React from "react";
import { Video, VideoFilters as VideoFiltersType, CategoryNew, Season } from "@/types";
import { VideoCameraIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, CardBody, Button, Skeleton } from "@heroui/react";
import { VideoCard } from "./VideoCard";
import { VideoPagination } from "./VideoPagination";

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
  filters: VideoFiltersType;
  categories: CategoryNew[];
  seasons: Season[];
  onEdit: (video: Video) => void;
  onDelete: (video: Video) => void;
  onAddVideo: () => void;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showAddButton?: boolean;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export function VideoGrid({
  videos,
  loading,
  filters,
  categories,
  seasons,
  onEdit,
  onDelete,
  onAddVideo,
  emptyStateTitle = "Žádná videa",
  emptyStateDescription,
  showAddButton = true,
  // Pagination props
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  itemsPerPage = 20,
  onPageChange,
}: VideoGridProps) {
  // Show loading skeleton
  if (loading && videos.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  // Show empty state
  if (videos.length === 0) {
    const hasActiveFilters = 
      filters.search || 
      filters.category_id || 
      filters.is_active !== undefined;

    const defaultDescription = hasActiveFilters
      ? "Nebyla nalezena žádná videa odpovídající filtru."
      : "Zatím nejsou přidána žádná videa.";

    return (
      <Card>
        <CardBody className="text-center py-12">
          <VideoCameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {emptyStateTitle}
          </h3>
          <p className="text-gray-600 mb-4">
            {emptyStateDescription || defaultDescription}
          </p>
          {showAddButton && !hasActiveFilters && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={onAddVideo}
            >
              Přidat první video
            </Button>
          )}
        </CardBody>
      </Card>
    );
  }

  // Show videos grid with pagination
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={`${video.id}-${video.updated_at}`}
            video={video}
            onEdit={onEdit}
            onDelete={onDelete}
            categories={categories}
            seasons={seasons}
          />
        ))}
      </div>
      
      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <VideoPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
