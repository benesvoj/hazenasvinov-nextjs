import {buildSelectOneQuery, buildSelectQuery} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/clubConfig';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {ClubConfig} from '@/types';

export async function getClubConfig(ctx: QueryContext): Promise<QueryResult<ClubConfig>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE).single();

    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY.singular}: `, error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as ClubConfig,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}: `, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
