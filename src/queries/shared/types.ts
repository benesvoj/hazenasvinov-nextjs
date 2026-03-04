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

/**
 * Options for retrieving entities, allowing customization of pagination, sorting, and filtering.
 *
 * @interface GetEntitiesOptions
 *
 * @property {PaginationOptions} [pagination] - Specifies the pagination configuration, such as page number and page size.
 * @property {SortOptions[]} [sorting] - Defines the sorting criteria, allowing multiple sorting rules.
 * @property {FilterOptions} [filters] - Specifies the filter options to refine the results based on criteria.
 * @property {Record<string, string[]>} [arrayFilters] - Allows applying advanced filtering for array-type fields, mapping field names to arrays of allowed values.
 */
export interface GetEntitiesOptions {
  pagination?: PaginationOptions;
  sorting?: SortOptions[];
  filters?: FilterOptions;
  arrayFilters?: Record<string, string[]>;
}
