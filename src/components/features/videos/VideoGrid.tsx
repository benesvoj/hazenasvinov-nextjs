'use client';

import React, {memo} from 'react';

import {Skeleton} from '@heroui/react';

import {VideoPagination} from '@/components';
import {Category, Club, Season, VideoSchema} from '@/types';

import {VideoCard} from './VideoCard';

interface VideoGridProps {
  videos: VideoSchema[];
  loading: boolean;
  categories: Category[];
  seasons: Season[];
  clubs: Club[];
  onEdit: (video: VideoSchema) => void;
  onDelete: (video: VideoSchema) => void;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export const VideoGrid = memo(function VideoGrid({
  videos,
  loading,
  categories,
  seasons,
  clubs,
  onEdit,
  onDelete,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  itemsPerPage = 20,
  onPageChange,
}: VideoGridProps) {
  if (loading && videos.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

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
            clubs={clubs}
          />
        ))}
      </div>

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
});
