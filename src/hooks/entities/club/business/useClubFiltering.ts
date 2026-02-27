'use client';

import {Club, UseClubsFilters} from '@/types';

export const useClubFiltering = (data: Club[], filters?: UseClubsFilters) => {
  const filteredData = !filters?.searchTerm
    ? data
    : data.filter(
        (club) =>
          club.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
          (club.description &&
            club.description.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
      );

  return {
    data: filteredData,
  };
};
