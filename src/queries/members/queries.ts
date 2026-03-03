import {DB_TABLE} from '@/queries/members';
import {buildMembersViewQuery} from '@/queries/members/queryHelpers';
import {Member} from '@/types';

import {QueryContext, QueryResult} from '../shared/types';

import {GetMembersOptions, MemberWithRelations} from './types';

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

/**
 * Get member by ID
 *
 * @example
 * const result = await getMemberById(supabase, '123');
 */
export async function getMemberById(ctx: QueryContext, id: string): Promise<QueryResult<Member>> {
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
