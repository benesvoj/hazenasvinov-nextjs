'use client';

import type {Category, Club, Season} from '@/types';

import {RecordingGrid} from '../components';
import type {RecordingSchema} from '../types';

interface RecordingsViewProps {
  recordings: RecordingSchema[];
  loading: boolean;

  categories: Category[];
  clubs: Club[];
  seasons: Season[];

  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;

  onEdit?: (item: RecordingSchema) => void;
  onDelete?: (item: RecordingSchema) => void;
  onPageChange: (page: number) => void;
}

export function RecordingsView({
  recordings,
  loading,
  categories,
  clubs,
  seasons,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onEdit,
  onDelete,
  onPageChange,
}: RecordingsViewProps) {
  return (
    <RecordingGrid
      recordings={recordings}
      loading={loading}
      categories={categories}
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
  );
}
