import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/comments';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {BaseComment, CommentInsert} from '@/types';

export async function createComment(
  ctx: QueryContext,
  data: CommentInsert
): Promise<QueryResult<BaseComment>> {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    const {data: comment, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: comment as unknown as BaseComment,
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

export async function updateComment(
  ctx: QueryContext,
  id: string,
  data: Partial<CommentInsert>
): Promise<QueryResult<BaseComment>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
    const {data: comment, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: comment as unknown as BaseComment,
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

export async function deleteComment(
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
