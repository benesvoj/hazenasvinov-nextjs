import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetCommitteesOptions} from '@/queries/committees/types';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Committee} from '@/types';

export async function getAllCommittees(
  ctx: QueryContext,
  options?: GetCommitteesOptions
): Promise<QueryResult<Committee[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, 'committees', {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<Committee>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as Committee[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in getAllCommittees:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getCommitteeById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<Committee>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, 'committees', id);
    const {data, error} = await query;

    if (error) {
      console.error('Error fetching committee:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as Committee,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getCommitteeById:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
