import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/categoryLineups';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {CategoryLineup} from '@/types';

interface GetCategoryLineupOptions extends GetEntitiesOptions {
  filters?: {
    categoryId?: string;
    seasonId?: string;
  };
}

export async function getAllCategoryLineups(
  ctx: QueryContext,
  options?: GetCategoryLineupOptions
): Promise<QueryResult<CategoryLineup[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<CategoryLineup>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as CategoryLineup[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getCategoryLineupById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<CategoryLineup>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);

    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY.singular}:`, error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as CategoryLineup,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ById:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
