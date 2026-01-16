import {SupabaseClient} from '@supabase/supabase-js';
import {createClient} from '@/utils/supabase/client';

type SupabaseQuery<T> = PromiseLike<{data: T | null; error: any}>;

/**
 * Higher-order function for client-side queries
 * Similar to withAuth/withAdminAuth but for React Query
 *
 * @example
 * ```typescript
 * // Instead of this boilerplate:
 * export async function fetchCategories() {
 *   const {createClient} = await import('@/utils/supabase/client');
 *   const supabase = createClient();
 *   const {data, error} = await supabase.from('categories').select('*');
 *   if (error) throw error;
 *   return data || [];
 * }
 *
 * // Write this:
 * export const fetchCategories = withClientQueryList<Category>((supabase) =>
 *   supabase.from('categories').select('*').order('sort_order')
 * );
 * ```
 */
export function withClientQuery<T>(
  queryBuilder: (supabase: SupabaseClient) => SupabaseQuery<T>
): () => Promise<T> {
  return async () => {
    const supabase = createClient();
    const {data, error} = await queryBuilder(supabase);

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from query');
    }

    return data;
  };
}

/**
 * Higher-order function for client-side queries that return arrays
 * Handles null data gracefully (returns empty array)
 *
 * @example
 * ```typescript
 * export const fetchCategories = withClientQueryList<Category>((supabase) =>
 *   supabase.from('categories').select('*').order('sort_order')
 * );
 * ```
 */
export function withClientQueryList<T>(
  queryBuilder: (supabase: SupabaseClient) => SupabaseQuery<T[]>
): () => Promise<T[]> {
  return async () => {
    const supabase = createClient();
    const {data, error} = await queryBuilder(supabase);

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    return data || [];
  };
}

/**
 * Higher-order function for client-side single entity queries
 * Returns null if not found
 *
 * @example
 * ```typescript
 * export const fetchCategoryById = withClientQuerySingle<Category, [string]>((supabase, id) =>
 *   supabase.from('categories').select('*').eq('id', id).single()
 * );
 * ```
 */
export function withClientQuerySingle<T, TParams extends any[] = []>(
  queryBuilder: (supabase: SupabaseClient, ...params: TParams) => SupabaseQuery<T>
): (...params: TParams) => Promise<T | null> {
  return async (...params: TParams) => {
    const supabase = createClient();
    const {data, error} = await queryBuilder(supabase, ...params);

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    return data;
  };
}