import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Committee, CommitteeInsert} from '@/types';

export async function createCommittee(
  ctx: QueryContext,
  data: CommitteeInsert
): Promise<QueryResult<Committee>> {
  try {
    const query = buildInsertQuery(ctx.supabase, 'committees', data);
    const {data: committee, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: committee as unknown as Committee,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in createCommittee:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateCommittee(
  ctx: QueryContext,
  id: string,
  data: Partial<CommitteeInsert>
): Promise<QueryResult<Committee>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, 'committees', id, data);
    const {data: committee, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: committee as unknown as Committee,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in updateCommittee:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteCommittee(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, 'committees', id);
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
    console.error('Exception in deleteCommittee:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
