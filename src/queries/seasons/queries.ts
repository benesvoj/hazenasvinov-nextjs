import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from "@/queries/seasons";
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {Season} from '@/types';

export async function getAllSeasons(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Season[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<Season>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as Season[],
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

export async function getSeasonById(ctx: QueryContext, id: string): Promise<QueryResult<Season>> {
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
      data: data as unknown as Season,
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
