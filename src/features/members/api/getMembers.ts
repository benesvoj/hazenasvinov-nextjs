import {DB_TABLE, GetMembersOptions} from '@/queries/members';
import {buildMembersViewQuery} from '@/queries/members/queryHelpers';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Member} from '@/types';

/**
 * Get all members with optional filtering and sorting
 *
 * @example
 * const result = await getAllMembers(supabase, {
 *   isInternal: true,
 *   page: 1,
 *   limit: 25
 * });
 */
export async function getMembersAll(
  ctx: QueryContext,
  options: GetMembersOptions = {}
): Promise<QueryResult<Member[]>> {
  try {
    const {data, error, count} = await buildMembersViewQuery(ctx, DB_TABLE, options);
    if (error) return {data: null, error: error.message, count: 0};
    return {data: data as Member[], error: null, count: count ?? 0};
  } catch (err: any) {
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}
