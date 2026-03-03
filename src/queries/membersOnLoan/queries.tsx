import {GetMembersOptions} from '@/queries/members';
import {buildMembersViewQuery} from '@/queries/members/queryHelpers';
import {DB_TABLE} from '@/queries/membersOnLoan';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {MemberOnLoan} from '@/types';

/**
 * Get members on loan
 *
 * @example
 * const result = await getMembersOnLoan(supabase);
 */
export async function getMembersOnLoan(
  ctx: QueryContext,
  options: GetMembersOptions
): Promise<QueryResult<MemberOnLoan[]>> {
  try {
    const {data, error, count} = await buildMembersViewQuery(ctx, DB_TABLE, options);
    if (error) return {data: null, error: error.message, count: 0};
    return {data: data as MemberOnLoan[], error: null, count: count ?? 0};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}
