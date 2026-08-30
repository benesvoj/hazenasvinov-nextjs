import {SupabaseClient} from '@supabase/supabase-js';

import {Database} from '@/types/database/supabase';

type PublicSchema = Database['public'];

/** Every table and view the query layer can read. */
export type QueryableTable = keyof PublicSchema['Tables'] | keyof PublicSchema['Views'];

type RowOf<T extends QueryableTable> = T extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][T]['Row']
  : T extends keyof PublicSchema['Views']
    ? PublicSchema['Views'][T]['Row']
    : never;

/**
 * Column filters for one table, keyed by its actual columns.
 *
 * `applyFilters` puts whatever key it is given straight into `.eq(key, value)`,
 * so a filter name is a column name — there is no mapping layer underneath. The
 * entities route already translates `?categoryId` into `category_id` via
 * `dbColumn` before the query layer sees it, which made it easy to declare the
 * camelCase parameter name here and filter on a column that does not exist:
 * silently, because the interface said otherwise. It happened in four query
 * files.
 *
 * Deriving the keys from the generated schema means the compiler now refuses
 * the camelCase name.
 *
 * @example
 * interface GetTrainingSessionsOptions extends GetEntitiesOptions {
 *   filters?: ColumnFilters<'training_sessions'>;
 * }
 */
export type ColumnFilters<T extends QueryableTable> = Partial<{
  [K in keyof RowOf<T>]: RowOf<T>[K] | NonNullable<RowOf<T>[K]>[];
}>;

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
