import {QueryResult} from './types';

/**
 * Handles a known Supabase bug where pagination beyond available records
 * returns a malformed error message starting with '{"'
 *
 * @param error - The error object from Supabase
 * @param count - The count value from the query
 * @returns QueryResult with empty array if it's the pagination bug, null otherwise
 */
export function handleSupabasePaginationBug<T>(
  error: any,
  count: number | null
): QueryResult<T[]> | null {
  if (error && error.message && (error.message === '{"' || error.message.startsWith('{"'))) {
    return {
      data: [],
      error: null,
      count: count ?? 0,
    };
  }
  return null;
}
