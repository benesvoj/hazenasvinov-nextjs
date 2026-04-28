'use client';

import {useMemo, useState} from 'react';

import type {RecordingFilters, RecordingSchema} from '../types';

export interface RecordingFilteringProps {
  recordings: RecordingSchema[];
  itemsPerPage: number;
  currentPage: number;
}

export const useRecordingFilter = ({
  recordings,
  itemsPerPage,
  currentPage,
}: RecordingFilteringProps) => {
  const [filters, setFilters] = useState<RecordingFilters>({});

  const {paginatedRecordings, totalPages, totalCount} = useMemo(() => {
    // 🔥 FIX
    let filtered = recordings ?? [];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (recording) =>
          recording.title.toLowerCase().includes(searchLower) ||
          recording.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category_id) {
      filtered = filtered.filter((r) => r.category_id === filters.category_id);
    }

    if (filters.club_id) {
      filtered = filtered.filter((r) => r.club_id === filters.club_id);
    }

    if (filters.season_id) {
      filtered = filtered.filter((r) => r.season_id === filters.season_id);
    }

    if (filters.is_active !== undefined) {
      filtered = filtered.filter((r) => r.is_active === filters.is_active);
    }

    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      paginatedRecordings: paginated,
      totalPages: pages,
      totalCount: total,
    };
  }, [recordings, filters, currentPage, itemsPerPage]);

  return {
    filters,
    setFilters,
    paginatedRecordings,
    totalPages,
    totalCount,
  };
};
