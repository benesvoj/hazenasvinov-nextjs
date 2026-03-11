import {GetMembersOptions} from '@/queries/members';
import {buildMembersViewQuery} from '@/queries/members/queryHelpers';
import {DB_TABLE} from '@/queries/membersExternal';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {MemberExternal} from '@/types';

/**
 * Get external members only
 *
 * @example
 * const result = await getExternalMembers(supabase);
 */
export async function getMembersExternal(
  ctx: QueryContext,
  options: GetMembersOptions = {}
): Promise<QueryResult<MemberExternal[]>> {
  try {
    const {data, error, count} = await buildMembersViewQuery(ctx, DB_TABLE, options);
    if (error) return {data: null, error: error.message, count: 0};
    return {data: data as MemberExternal[], error: null, count: count ?? 0};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}
