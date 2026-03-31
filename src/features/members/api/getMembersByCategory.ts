import {DB_TABLE} from '@/queries/members';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Member} from '@/types';

/**
 * Get members by category ID
 *
 * @example
 * const result = await getMembersByCategory(supabase, 'cat-123');
 */
export async function getMembersByCategory(
  ctx: QueryContext,
  categoryId: string
): Promise<QueryResult<Member[]>> {
  try {
    const {data, error, count} = await ctx.supabase
      .from(DB_TABLE)
      .select('*', {count: 'exact'})
      .eq('category_id', categoryId)
      .order('surname', {ascending: true});

    if (error) {
      console.error('Error fetching members by category:', error);
      return {
        data: null,
        error: error.message,
        count: 0,
      };
    }

    return {
      data: data as Member[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in getMembersByCategory:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}
