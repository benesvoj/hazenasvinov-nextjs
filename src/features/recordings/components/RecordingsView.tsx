'use client';

import type {Category, Club, Season} from '@/types';

import {RecordingTable} from '../components/RecordingTable';
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
  onEdit,
  onDelete,
  onPageChange,
}: RecordingsViewProps) {
  return (
    <RecordingTable
      recordings={recordings}
      loading={loading}
      categories={categories}
      seasons={seasons}
      clubs={clubs}
      onEdit={onEdit}
      onDelete={onDelete}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
  );
}
