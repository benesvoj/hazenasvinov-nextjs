'use client';

import {useCallback, useEffect, useState} from 'react';

import {buildSelectQuery} from '@/queries/shared/queryBuilder';
import {useQueryContext} from '@/shared/hooks/useQueryContext';

type FeatureQueryConfig<TFilters = Record<string, any>> = {
  table: string;
  entityName: string;
  errorMessage: string;
  select?: string;
};

type FeatureQueryParams<TFilters = any> = {
  filters?: TFilters;
  page?: number;
  limit?: number;
  sort?: {
    column: string;
    ascending?: boolean;
  }[];
};

export function createFeatureQuery<TData, TFilters = any>(
  config: FeatureQueryConfig,
  mapFilters?: (filters?: TFilters) => Record<string, any>
) {
  return function useFeatureQuery(params?: FeatureQueryParams<TFilters>) {
    const ctx = useQueryContext();

    const [data, setData] = useState<TData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const paramsKey = params ? JSON.stringify(params) : '';

    const fetchData = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const parsedParams = params ? JSON.parse(paramsKey) : undefined;

        const filters = mapFilters ? mapFilters(parsedParams?.filters) : {};

        const pagination = parsedParams?.limit
          ? {
              page: parsedParams.page ?? 1,
              limit: parsedParams.limit,
            }
          : undefined;

        const query = buildSelectQuery<TData>(ctx.supabase, config.table, {
          select: config.select,
          filters,
          sorting: parsedParams?.sort,
          pagination,
        });

        const {data: result, error, count} = await query;

        if (error) throw error;

        setData((result ?? []) as TData[]);
        setTotalCount(count ?? 0);
      } catch (err: any) {
        console.error(err);
        setError(err.message || config.errorMessage);
      } finally {
        setLoading(false);
      }
    }, [ctx, paramsKey]);

    useEffect(() => {
      void fetchData();
    }, [fetchData]);

    const totalPages = params?.limit ? Math.ceil(totalCount / params.limit) : 1;

    return {
      data,
      loading,
      error,
      refetch: fetchData,
      totalCount,
      totalPages,
    };
  };
}
