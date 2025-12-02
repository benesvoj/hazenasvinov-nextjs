import {SupabaseClient} from '@supabase/supabase-js';

import {SortOptions, PaginationOptions} from './types';

/**
 * Apply sorting to a Supabase query
 */
export function applySorting<T>(query: any, sortOptions?: SortOptions[]) {
  if (!sortOptions || sortOptions.length === 0) {
    return query;
  }

  let sortedQuery = query;
  for (const sort of sortOptions) {
    sortedQuery = sortedQuery.order(sort.column, {
      ascending: sort.ascending ?? true,
    });
  }

  return sortedQuery;
}

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination<T>(query: any, pagination?: PaginationOptions) {
  if (!pagination) {
    return query;
  }

  const {page = 1, limit = 25, offset} = pagination;

  // Use offset if provided, otherwise calculate from page
  const actualOffset = offset ?? (page - 1) * limit;

  console.log('[applyPagination] page:', page, 'limit:', limit, 'actualOffset:', actualOffset);
  console.log('[applyPagination] range:', actualOffset, 'to', actualOffset + limit - 1);

  return query.range(actualOffset, actualOffset + limit - 1);
}

/**
 * Apply filters to a Supabase query
 */
export function applyFilters<T>(query: any, filters?: Record<string, any>) {
  if (!filters || Object.keys(filters).length === 0) {
    return query;
  }

  let filteredQuery = query;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      filteredQuery = filteredQuery.eq(key, value);
    }
  }

  return filteredQuery;
}

/**
 * Build a standard select query with common options
 */
export function buildSelectQuery<T>(
  supabase: SupabaseClient,
  table: string,
  options: {
    select?: string;
    filters?: Record<string, any>;
    sorting?: SortOptions[];
    pagination?: PaginationOptions;
  } = {}
) {
  const {select = '*', filters, sorting, pagination} = options;

  let query = supabase.from(table).select(select, {count: 'exact'});

  query = applyFilters(query, filters);
  query = applySorting(query, sorting);
  query = applyPagination(query, pagination);

  return query;
}

/**
 * Build a query to fetch a single record by ID
 */
export function buildSelectOneQuery<T>(
  supabase: SupabaseClient,
  table: string,
  id: string,
  options: {
    select?: string;
    idColumn?: string;
  } = {}
) {
  const {select = '*', idColumn = 'id'} = options;

  return supabase.from(table).select(select).eq(idColumn, id).single();
}

/**
 * Build an insert query
 */
export function buildInsertQuery<T>(
  supabase: SupabaseClient,
  table: string,
  data: Partial<T>,
  options: {
    select?: string;
    addTimestamp?: boolean;
  } = {}
) {
  const {select = '*', addTimestamp = true} = options;

  const insertData = addTimestamp ? {...data, created_at: new Date().toISOString()} : data;

  return supabase.from(table).insert(insertData).select(select).single();
}

/**
 * Build an update query
 */
export function buildUpdateQuery<T>(
  supabase: SupabaseClient,
  table: string,
  id: string,
  data: Partial<T>,
  options: {
    select?: string;
    idColumn?: string;
  } = {}
) {
  const {select = '*', idColumn = 'id'} = options;

  return supabase.from(table).update(data).eq(idColumn, id).select(select).single();
}

/**
 * Build a delete query
 */
export function buildDeleteQuery(
  supabase: SupabaseClient,
  table: string,
  id: string,
  options: {
    idColumn?: string;
  } = {}
) {
  const {idColumn = 'id'} = options;

  return supabase.from(table).delete().eq(idColumn, id);
}
