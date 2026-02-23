import {QueryContext, QueryResult} from '@/queries/shared/types';
import {CoachCard, CoachCardInsert, CoachCardUpdate} from '@/types';

import {DB_TABLE, ENTITY} from './constants';

/**
 * Create a new coach card
 */
export async function createCoachCard(
  ctx: QueryContext,
  data: CoachCardInsert
): Promise<QueryResult<CoachCard>> {
  try {
    const {data: card, error} = await ctx.supabase.from(DB_TABLE).insert(data).select().single();

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: card as unknown as CoachCard, error: null};
  } catch (err: any) {
    console.error(`Exception in create${ENTITY.singular}:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Update an existing coach card
 * @param ctx
 * @param id
 * @param data
 */
export async function updateCoachCard(
  ctx: QueryContext,
  id: string,
  data: Record<string, any>
): Promise<QueryResult<CoachCard>> {
  try {
    const {data: card, error} = await ctx.supabase
      .from(DB_TABLE)
      .update({...data, updated_at: new Date().toISOString()})
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return {data: null, error: error.message};
    }
    return {data: card as unknown as CoachCard, error: null};
  } catch (err: any) {
    console.error(`Exception in update${ENTITY.singular}:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 *  Delete a coach card by ID
 */
export async function deleteCoachCard(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const {error} = await ctx.supabase.from(DB_TABLE).delete().eq('id', id);

    if (error) {
      return {data: null, error: error.message};
    }
    return {data: {success: true}, error: null};
  } catch (err: any) {
    console.error(`Exception in delete${ENTITY.singular}:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}
