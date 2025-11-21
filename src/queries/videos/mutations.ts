import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/videos';
import {VideoInsert, VideoSchema} from '@/types';

export async function createVideo(
  ctx: QueryContext,
  data: VideoInsert
): Promise<QueryResult<VideoSchema>> {
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
      data: item as unknown as VideoSchema,
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

export async function updateVideo(
  ctx: QueryContext,
  id: string,
  data: Partial<VideoInsert>
): Promise<QueryResult<VideoSchema>> {
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
      data: item as unknown as VideoSchema,
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

export async function deleteVideo(
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
