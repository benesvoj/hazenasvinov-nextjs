import {normalizeSearchTerm} from '@/utils/normalizeSearchTerm';

import {DB_TABLE} from '@/queries/members';
import {buildMembersViewQuery} from '@/queries/members/queryHelpers';
import {Member, MemberDuplicate} from '@/types';

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
 * Find members carrying the same first name + surname, across every category.
 *
 * Matching runs on the `search_text` computed field, so it ignores diacritics
 * and letter case — "Jan Novak" finds "Ján Novák". Namesakes are legitimate, so
 * callers must treat the result as a warning, never as a validation failure.
 *
 * @param options.excludeId - Member being edited; kept out of its own results.
 * @param options.limit     - Maximum matches to return (default 5).
 */
export async function getMemberDuplicates(
  ctx: QueryContext,
  options: {name: string; surname: string; excludeId?: string; limit?: number}
): Promise<QueryResult<MemberDuplicate[]>> {
  const {name, surname, excludeId, limit = 5} = options;

  const term = normalizeSearchTerm(`${name} ${surname}`);

  if (!term) return {data: [], error: null, count: 0};

  try {
    let query = ctx.supabase
      .from(DB_TABLE)
      .select('id, name, surname, registration_number, category_id, is_active')
      .ilike('search_text', `%${term}%`)
      .order('surname', {ascending: true})
      .limit(limit);

    if (excludeId) query = query.neq('id', excludeId);

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching member duplicates:', error);
      return {data: null, error: error.message};
    }

    return {data: data as MemberDuplicate[], error: null, count: data?.length ?? 0};
  } catch (err: any) {
    console.error('Exception in getMemberDuplicates:', err);
    return {data: null, error: err.message || 'Unknown error'};
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
