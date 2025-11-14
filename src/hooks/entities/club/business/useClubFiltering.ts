'use client';

import {useCallback} from 'react';

import {Club, UseClubsFilters} from '@/types';

export const useClubFiltering = (data: Club[], filters?: UseClubsFilters) => {
  const getFilterClubs = useCallback(() => {
    if (!filters?.searchTerm) return data;

    return data.filter(
      (club) =>
        club.name.toLowerCase().includes(filters.searchTerm!.toLowerCase()) ||
        (club.description &&
          club.description.toLowerCase().includes(filters.searchTerm!.toLowerCase()))
    );
  }, [data, filters?.searchTerm]);

  return {
    data: getFilterClubs(),
  };
};
