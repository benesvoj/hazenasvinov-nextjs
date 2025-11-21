import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/videos';
import {VideoSchema} from '@/types';

export async function getAllVideos(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<VideoSchema[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      filters: options?.filters,
      sorting: options?.sorting,
      pagination: options?.pagination,
    });

    const {data, error, count} = await query;

    const paginationBugResult = handleSupabasePaginationBug<VideoSchema>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }
    return {
      data: data as unknown as VideoSchema[],
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

export async function getVideoById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<VideoSchema>> {
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
      data: data as unknown as VideoSchema,
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
