'use client';

import {useState} from 'react';

import {useCoachCategory} from '@/features/coach/providers/CategoryProvider';

import {useRecordings, useRecordingFilter} from './';

export function useCoachRecordingsPageLogic() {
  const [currentPage, setCurrentPage] = useState(1);

  const {availableCategories} = useCoachCategory();

  const {data: recordings, loading} = useRecordings({
    categoryIds: availableCategories.map((c) => c.id),
  });

  const {filters, setFilters, paginatedRecordings, totalPages, totalCount} = useRecordingFilter({
    recordings,
    itemsPerPage: 20,
    currentPage,
  });

  return {
    availableCategories,
    loading,
    recordings: paginatedRecordings,
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount,
  };
}
