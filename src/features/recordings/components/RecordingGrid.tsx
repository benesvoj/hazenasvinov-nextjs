'use client';

import React, {memo} from 'react';

import {Skeleton} from '@heroui/skeleton';

import {RecordingPagination} from '@/components';
import {Category, Club, Season} from '@/types';
import {isEmpty} from '@/utils';

import type {RecordingSchema} from '../types';

import {RecordingCard} from './RecordingCard';

interface RecordingGridProps {
  recordings: RecordingSchema[];
  loading: boolean;
  categories: Category[];
  seasons: Season[];
  clubs: Club[];
  onEdit?: (item: RecordingSchema) => void;
  onDelete?: (item: RecordingSchema) => void;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export const RecordingGrid = memo(function VideoGrid({
  recordings,
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
}: RecordingGridProps) {
  if (loading && isEmpty(recordings)) {
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
        {recordings.map((recording) => (
          <RecordingCard
            key={`${recording.id}-${recording.updated_at}`}
            recording={recording}
            onEdit={onEdit}
            onDelete={onDelete}
            categories={categories}
            seasons={seasons}
            clubs={clubs}
          />
        ))}
      </div>

      {onPageChange && totalPages > 1 && (
        <RecordingPagination
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
