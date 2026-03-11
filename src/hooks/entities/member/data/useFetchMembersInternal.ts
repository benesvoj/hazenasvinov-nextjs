'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

import {API_ROUTES} from '@/lib/api-routes';

import {showToast} from '@/components';
import {Genders, MemberFunction} from '@/enums';
import {useDebounce} from '@/hooks';
import {convertToInternalMemberWithPayment, MemberInternal, MembersInternalSchema} from '@/types';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number | null;
}

interface MembersInternalOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
  search?: string;
  filters?: {
    sex?: Genders;
    category_id?: string;
    function?: MemberFunction;
    isActive?: boolean;
  };
}

/**
 * Custom hook to fetch internal members with pagination, search, and filters.
 * @param options
 */
export const useFetchMembersInternal = (options: MembersInternalOptions = {}) => {
  const {
    page: initialPage = 1,
    limit: initialLimit = 25,
    enabled = true,
    search = '',
    filters = {},
  } = options;

  const [data, setData] = useState<MemberInternal[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: initialPage,
    limit: initialLimit,
    total: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const debouncedSex = useDebounce(filters?.sex, 300);
  const debouncedCatId = useDebounce(filters?.category_id, 300);
  const debouncedFn = useDebounce(filters?.function, 300);

  const fetchData = useCallback(
    async (page: number, limit: number) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const url = new URL(API_ROUTES.members.internal, window.location.origin);
        url.searchParams.set('page', page.toString());
        url.searchParams.set('limit', limit.toString());
        if (debouncedSearch) url.searchParams.set('search', debouncedSearch);
        if (debouncedSex) url.searchParams.set('sex', debouncedSex);
        if (debouncedCatId) url.searchParams.set('category_id', debouncedCatId);
        if (debouncedFn) url.searchParams.set('function', debouncedFn);
        if (filters?.isActive) url.searchParams.set('isActive', 'true');

        const response = await fetch(url.toString(), {
          signal: abortControllerRef.current.signal,
        });
        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Failed to load members');

        setData(
          (result.data.items as MembersInternalSchema[]).map(convertToInternalMemberWithPayment)
        );
        setPagination({page, limit, total: result.data.total ?? null});
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to load members';
        setError(errorMessage);
        showToast.danger(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, debouncedSex, debouncedCatId, debouncedFn, filters?.isActive]
  );

  useEffect(() => {
    if (!enabled) return;
    void fetchData(1, pagination.limit);
  }, [enabled, fetchData, pagination.limit]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  const refresh = useCallback(() => {
    void fetchData(pagination.page, pagination.limit);
  }, [fetchData, pagination.page, pagination.limit]);

  const goToPage = useCallback(
    (newPage: number) => {
      void fetchData(newPage, pagination.limit);
    },
    [fetchData, pagination.limit]
  );

  const changePageSize = useCallback(
    (newLimit: number) => {
      void fetchData(1, newLimit);
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
