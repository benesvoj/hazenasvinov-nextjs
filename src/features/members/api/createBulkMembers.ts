import {SupabaseClient} from '@supabase/supabase-js';

import {membersModel} from '@/features/members/model';
import {QueryResult} from '@/queries/shared/types';
import {Member, MemberInsert} from '@/types';

/**
 * Bulk create members
 *
 * @example
 * const result = await bulkCreateMembers(adminClient, [
 *   { name: 'John', surname: 'Doe' },
 *   { name: 'Jane', surname: 'Smith' }
 * ]);
 */
export async function createBulkMembers(
  supabase: SupabaseClient,
  members: MemberInsert[]
): Promise<QueryResult<Member[]>> {
  try {
    const timestamp = new Date().toISOString();
    const membersWithTimestamp = members.map((m) => ({
      ...m,
      created_at: timestamp,
    }));

    const {data, error} = await supabase
      .from(membersModel.table)
      .insert(membersWithTimestamp)
      .select();

    if (error) {
      console.error('Error bulk creating members:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as Member[],
      error: null,
      count: data?.length ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in bulkCreateMembers:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
