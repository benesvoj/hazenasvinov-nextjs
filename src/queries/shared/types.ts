import {SupabaseClient} from '@supabase/supabase-js';

/**
 * Standard query result wrapper
 */
export interface QueryResult<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort options
 */
export interface SortOptions {
  column: string;
  ascending?: boolean;
}

/**
 * Filter options (generic)
 */
export interface FilterOptions {
  [key: string]: any;
}

/**
 * Query context - passed to all query functions
 */
export interface QueryContext {
  supabase: SupabaseClient;
  userId?: string;
}
