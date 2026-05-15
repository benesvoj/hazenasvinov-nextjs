import {DB_TABLE, ENTITY} from '@/queries/referees/constants';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Referee, RefereeInsert} from '@/types';

let helpers: ReturnType<typeof createMutationHelpers<Referee, RefereeInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Referee, RefereeInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createReferee = (ctx: QueryContext, data: RefereeInsert) =>
  getHelpers().create(ctx, data);

export const updateReferee = (ctx: QueryContext, id: string, data: Partial<RefereeInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteReferee = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);

export async function setMatchReferees(
  ctx: QueryContext,
  matchId: string,
  refereeId1: string | null,
  refereeId2: string | null
): Promise<QueryResult<void>> {
  try {
    const {error: deleteError} = await ctx.supabase
      .from('match_referees')
      .delete()
      .eq('match_id', matchId);

    if (deleteError) return {data: null, error: deleteError.message};

    const rows = [];
    if (refereeId1) rows.push({match_id: matchId, referee_id: refereeId1, order: 1});
    if (refereeId2) rows.push({match_id: matchId, referee_id: refereeId2, order: 2});

    if (rows.length > 0) {
      const {error: insertError} = await ctx.supabase.from('match_referees').insert(rows);
      if (insertError) return {data: null, error: insertError.message};
    }

    return {data: undefined, error: null};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error'};
  }
}
