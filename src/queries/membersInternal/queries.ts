import {GetMembersOptions} from '@/queries/members';
import {buildMembersViewQuery} from '@/queries/members/queryHelpers';
import {DB_TABLE} from '@/queries/membersInternal';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {MemberInternal} from '@/types';

/**
 * Get internal members only
 *
 * @example
 * const result = await getInternalMembers(supabase);
 */
export async function getMembersInternal(
  ctx: QueryContext,
  options: GetMembersOptions = {}
): Promise<QueryResult<MemberInternal[]>> {
  try {
    const {data, error, count} = await buildMembersViewQuery(ctx, DB_TABLE, options);
    if (error) return {data: null, error: error.message, count: 0};
    return {data: data as MemberInternal[], error: null, count: count ?? 0};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}
