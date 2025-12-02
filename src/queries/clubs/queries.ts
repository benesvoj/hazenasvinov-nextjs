import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {Club} from '@/types';

export async function getAllClubs(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Club[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, 'clubs', {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<Club>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as Club[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in getAllClubs:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getClubById(ctx: QueryContext, id: string): Promise<QueryResult<Club>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, 'clubs', id);

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching club:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as Club,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getClubById:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
