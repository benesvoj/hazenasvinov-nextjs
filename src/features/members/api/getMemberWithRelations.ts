import {DB_TABLE, MemberWithRelations} from '@/queries/members';
import {QueryContext, QueryResult} from '@/queries/shared/types';

/**
 * Get member with all related data (functions, payments, etc.)
 *
 * @example
 * const result = await getMemberWithRelations(supabase, '123');
 */
export async function getMemberWithRelations(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<MemberWithRelations>> {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .select(
        `
        *,
        member_functions(
          function_id,
          function_name,
          start_date,
          end_date
        ),
        member_payments(
          amount,
          paid_at,
          status
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching member with relations:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as MemberWithRelations,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getMemberWithRelations:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
