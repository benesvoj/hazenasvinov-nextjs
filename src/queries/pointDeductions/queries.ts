import {DB_TABLE, ENTITY} from '@/queries/pointDeductions/constants';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {PointDeduction} from '@/types';

export async function getAllPointDeductions(
  ctx: QueryContext,
  options?: {categoryId?: string; seasonId?: string}
): Promise<QueryResult<PointDeduction[]>> {
  try {
    let query = ctx.supabase
      .from(DB_TABLE)
      .select(
        `
        *,
        team:club_category_teams(
          id,
          team_suffix,
          club_category:club_categories(
            club:clubs(id, name, short_name)
          )
        )
      `
      )
      .order('created_at', {ascending: false});

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options?.seasonId) {
      query = query.eq('season_id', options.seasonId);
    }

    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY.plural}`, error);
      return {data: null, error: error.message, count: 0};
    }

    return {data: data as PointDeduction[], error: null, count: data?.length ?? 0};
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}`, err);
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}

export async function getPointDeductionById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<PointDeduction>> {
  try {
    const {data, error} = await ctx.supabase.from(DB_TABLE).select('*').eq('id', id).single();

    if (error) {
      console.error(`Error fetching ${ENTITY.singular}`, error);
      return {data: null, error: error.message};
    }

    return {data: data as PointDeduction, error: null};
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ById`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}
