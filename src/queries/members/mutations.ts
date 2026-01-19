import {SupabaseClient} from '@supabase/supabase-js';

import {DB_TABLE, ENTITY} from '@/queries/members';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Member, MemberInsert} from '@/types';

/**
 * CRUD mutations for Members
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<Member, MemberInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Member, MemberInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createMember = (ctx: QueryContext, data: MemberInsert) =>
  getHelpers().create(ctx, data);

export const updateMember = (ctx: QueryContext, id: string, data: Partial<MemberInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteMember = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);

/**
 * Bulk create members
 *
 * @example
 * const result = await bulkCreateMembers(adminClient, [
 *   { name: 'John', surname: 'Doe' },
 *   { name: 'Jane', surname: 'Smith' }
 * ]);
 */
export async function bulkCreateMembers(
  supabase: SupabaseClient,
  members: MemberInsert[]
): Promise<QueryResult<Member[]>> {
  try {
    const timestamp = new Date().toISOString();
    const membersWithTimestamp = members.map((m) => ({
      ...m,
      created_at: timestamp,
    }));

    const {data, error} = await supabase.from('members').insert(membersWithTimestamp).select();

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
