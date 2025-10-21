'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {showToast} from '@/components';
import {API_ROUTES} from '@/lib';
import {convertToInternalMemberWithPayment, MemberInternal} from '@/types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number | null;
}

interface UseFetchMembersInternalOptions {
  page?: number;
  limit?: number;
  enabled?: boolean; // Allow disabling auto-fetch
  search?: string;
  filters?: {
    sex?: string;
    category_id?: string;
    function?: string;
  };
}

export const useFetchMembersInternal = (options: UseFetchMembersInternalOptions = {}) => {
  const {
    page: initialPage = 1,
    limit: initialLimit = 25,
    enabled = true,
    search: initialSearch = '',
    filters: initialFilters = {},
  } = options;

  const [data, setData] = useState<MemberInternal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: initialPage,
    limit: initialLimit,
    total: null,
  });

  // Use ref to track if this is the initial mount
  const isInitialMount = useRef(true);
  const searchRef = useRef(initialSearch);
  const filtersRef = useRef(initialFilters);

  // Update refs when props change
  searchRef.current = initialSearch;
  filtersRef.current = initialFilters;

  const fetchData = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(API_ROUTES.members.internal, window.location.origin);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', limit.toString());

      // Add search parameter
      if (searchRef.current) {
        url.searchParams.set('search', searchRef.current);
      }

      // Add filter parameters
      if (filtersRef.current.sex) {
        url.searchParams.set('sex', filtersRef.current.sex);
      }
      if (filtersRef.current.category_id) {
        url.searchParams.set('category_id', filtersRef.current.category_id);
      }
      if (filtersRef.current.function) {
        url.searchParams.set('function', filtersRef.current.function);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.data.map(convertToInternalMemberWithPayment) || []);
      setPagination(result.pagination || {page, limit, total: null});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
      setError(errorMessage);
      showToast.danger(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - uses refs instead

  // Initial fetch on mount only
  useEffect(() => {
    if (enabled && isInitialMount.current) {
      isInitialMount.current = false;
      fetchData(initialPage, initialLimit);
    }
  }, [enabled, initialPage, initialLimit, fetchData]);

  // Create stable filter string for dependency tracking
  const filterString = useMemo(
    () => JSON.stringify(initialFilters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialFilters.sex, initialFilters.category_id, initialFilters.function]
  );

  // Re-fetch when search/filters change (debounced)
  useEffect(() => {
    if (!enabled || isInitialMount.current) return;

    const timer = setTimeout(() => {
      fetchData(1, pagination.limit); // Reset to page 1 on search/filter change
    }, 300);

    return () => clearTimeout(timer);
  }, [enabled, initialSearch, filterString, pagination.limit, fetchData]);

  const refresh = useCallback(() => {
    fetchData(pagination.page, pagination.limit);
  }, [fetchData, pagination.page, pagination.limit]);

  const goToPage = useCallback(
    (newPage: number) => {
      fetchData(newPage, pagination.limit);
    },
    [fetchData, pagination.limit]
  );

  const changePageSize = useCallback(
    (newLimit: number) => {
      fetchData(1, newLimit); // Reset to page 1 when changing page size
    },
    [fetchData]
  );

  return {
    data,
    loading,
    error,
    pagination,
    refresh,
    goToPage,
    changePageSize,
  };
};
