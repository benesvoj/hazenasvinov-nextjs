import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/trainingSessions';
import {BaseTrainingSession} from '@/types';

interface GetTrainingSessionsOptions extends GetEntitiesOptions {
  filters?: {
    categoryId?: string;
    seasonId?: string;
  };
}

export async function getAllTrainingSessions(
  ctx: QueryContext,
  options?: GetTrainingSessionsOptions
): Promise<QueryResult<BaseTrainingSession[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      filters: options?.filters,
      sorting: options?.sorting,
      pagination: options?.pagination,
    });

    const {data, error, count} = await query;

    const paginationBugResult = handleSupabasePaginationBug<BaseTrainingSession>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }
    return {
      data: data as unknown as BaseTrainingSession[],
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

export async function getTrainingSessionById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<BaseTrainingSession>> {
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
      data: data as unknown as BaseTrainingSession,
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
