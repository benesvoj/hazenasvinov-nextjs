'use client';

import {useCallback, useEffect, useState} from 'react';

import {API_ROUTES} from '@/lib';
import {CategoryMembershipFee} from '@/types';

export interface UseFilters {
  selectedYear?: number;
}

export function useFetchCategoryMembershipFees(filters?: UseFilters) {
  const [data, setData] = useState<CategoryMembershipFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(API_ROUTES.categoryMembershipFees);
      const response = await res.json();

      setData(response.data || []);
    } catch (error) {
      console.error('Fetching category membership fees failed:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFilteredData = useCallback(() => {
    if (!filters!.selectedYear) return data;

    return data.filter(
      (item) => item.calendar_year === (filters?.selectedYear || new Date().getFullYear())
    );
  }, [data, filters]);

  return {
    data: getFilteredData(),
    loading,
    error,
    refetch: fetchData,
  };
}
