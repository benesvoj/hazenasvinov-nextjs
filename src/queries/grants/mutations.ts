import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/grants/constants';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Grant, GrantInsert} from '@/types';

export async function createGrant(
  ctx: QueryContext,
  data: GrantInsert
): Promise<QueryResult<Grant>> {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    const {data: grant, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: grant as unknown as Grant,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in create${ENTITY}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateGrant(
  ctx: QueryContext,
  id: string,
  data: Partial<GrantInsert>
): Promise<QueryResult<Grant>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
    const {data: grant, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: grant as unknown as Grant,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in update${ENTITY}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteGrant(
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
    console.error(`Exception in delete${ENTITY}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
