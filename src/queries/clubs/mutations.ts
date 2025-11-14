import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Club, ClubInsert} from '@/types';

export async function createClub(ctx: QueryContext, data: ClubInsert): Promise<QueryResult<Club>> {
  try {
    const query = buildInsertQuery(ctx.supabase, 'clubs', data);
    const {data: club, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: club as unknown as Club,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in createClub:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateClub(
  ctx: QueryContext,
  id: string,
  data: Partial<ClubInsert>
): Promise<QueryResult<Club>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, 'clubs', id, data);
    const {data: club, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: club as unknown as Club,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in updateClub:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteClub(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, 'clubs', id);
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
    console.error('Exception in deleteClub:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
