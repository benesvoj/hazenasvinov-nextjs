import {SupabaseClient} from '@supabase/supabase-js';

import {Member, MemberInsert} from '@/types';

import {QueryResult} from '../shared/types';

/**
 * Create a new member
 *
 * @example
 * const result = await createMember(adminClient, {
 *   name: 'John',
 *   surname: 'Doe',
 *   registration_number: '12345'
 * });
 */
export async function createMember(
  supabase: SupabaseClient,
  data: MemberInsert
): Promise<QueryResult<Member>> {
  try {
    const {data: member, error} = await supabase
      .from('members')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: member as Member,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in createMember:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Update an existing member
 *
 * @example
 * const result = await updateMember(adminClient, '123', {
 *   name: 'Jane'
 * });
 */
export async function updateMember(
  supabase: SupabaseClient,
  id: string,
  data: Partial<MemberInsert>
): Promise<QueryResult<Member>> {
  try {
    const {data: member, error} = await supabase
      .from('members')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: member as Member,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in updateMember:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Delete a member
 *
 * @example
 * const result = await deleteMember(adminClient, '123');
 */
export async function deleteMember(
  supabase: SupabaseClient,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const {error} = await supabase.from('members').delete().eq('id', id);

    if (error) {
      console.error('Error deleting member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: {success: true},
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in deleteMember:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

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
