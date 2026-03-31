import {DB_TABLE} from '@/queries/members';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Member} from '@/types';

/**
 * Get member by ID
 *
 * @example
 * const result = await getMemberById(supabase, '123');
 */
export async function getMember(ctx: QueryContext, id: string): Promise<QueryResult<Member>> {
  try {
    const {data, error} = await ctx.supabase.from(DB_TABLE).select('*').eq('id', id).single();

    if (error) {
      console.error('Error fetching member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as Member,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getMemberById:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
