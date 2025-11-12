'use client';

import {useCallback, useEffect, useState} from 'react';

import {API_ROUTES, translations} from '@/lib';
import {Club, UseClubsFilters} from '@/types';

const t = translations.admin.clubs;

export function useFetchClubs(filters?: UseClubsFilters) {
  const [data, setData] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setErrors(null);

      const res = await fetch(API_ROUTES.clubs.root, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      });

      const response = await res.json();

      if (!res.ok) {
        throw new Error(response.error || t.responseMessages.clubsFetchError);
      }
      setData(response.data || []);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      setErrors(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter categories based on search term
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
    loading,
    errors,
    refetch: fetchData,
  };
}
