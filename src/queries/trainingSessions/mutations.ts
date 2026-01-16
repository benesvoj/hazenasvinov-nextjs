import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/trainingSessions';
import {BaseTrainingSession, TrainingSessionInsert} from '@/types';

export async function createTrainingSession(
  ctx: QueryContext,
  data: TrainingSessionInsert
): Promise<QueryResult<BaseTrainingSession>> {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    const {data: item, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: item as unknown as BaseTrainingSession,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in create${ENTITY.singular}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateTrainingSession(
  ctx: QueryContext,
  id: string,
  data: Partial<TrainingSessionInsert>
): Promise<QueryResult<BaseTrainingSession>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
    const {data: item, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: item as unknown as BaseTrainingSession,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in update${ENTITY.singular}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteTrainingSession(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, DB_TABLE, id);
    const {error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: {success: true},
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in delete${ENTITY.singular}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
