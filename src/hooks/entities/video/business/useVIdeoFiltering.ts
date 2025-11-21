import {useMemo, useState} from 'react';

import {VideoFilters, VideoSchema} from '@/types';

export interface VideoFilteringProps {
  videos: VideoSchema[];
  itemsPerPage: number;
  currentPage: number;
}

export const useVideoFiltering = ({videos, itemsPerPage, currentPage}: VideoFilteringProps) => {
  const [filters, setFilters] = useState<VideoFilters>({});

  const {paginatedVideos, totalPages, totalCount} = useMemo(() => {
    // Apply filters
    let filtered = videos;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (video) =>
          video.title.toLowerCase().includes(searchLower) ||
          video.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.category_id) {
      filtered = filtered.filter((video) => video.category_id === filters.category_id);
    }

    if (filters.club_id) {
      filtered = filtered.filter((video) => video.club_id === filters.club_id);
    }

    if (filters.season_id) {
      filtered = filtered.filter((video) => video.season_id === filters.season_id);
    }

    if (filters.is_active !== undefined) {
      filtered = filtered.filter((video) => video.is_active === filters.is_active);
    }

    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      paginatedVideos: paginated,
      totalPages: pages,
      totalCount: total,
    };
  }, [videos, filters, currentPage, itemsPerPage]);

  return {
    filters,
    setFilters,
    paginatedVideos,
    totalPages,
    totalCount,
  };
};
