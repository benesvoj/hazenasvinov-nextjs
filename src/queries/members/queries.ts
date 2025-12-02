import {SupabaseClient} from '@supabase/supabase-js';

import {Member} from '@/types';

import {QueryResult} from '../shared/types';

import {MemberWithRelations, GetMembersOptions, MemberFilters} from './types';

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
export async function getAllMembers(
  supabase: SupabaseClient,
  options: GetMembersOptions = {}
): Promise<QueryResult<Member[]>> {
  try {
    const {isInternal, isExternal, onLoan, activeOnly, page = 1, limit = 100, search} = options;

    // Build base query
    let query = supabase.from('members').select('*', {count: 'exact'});

    // Apply filters
    if (isInternal !== undefined) {
      query = query.eq('is_internal', isInternal);
    }
    if (isExternal !== undefined) {
      query = query.eq('is_external', isExternal);
    }
    if (onLoan !== undefined) {
      query = query.eq('on_loan', onLoan);
    }
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Apply search
    if (search && search.trim().length > 0) {
      query = query.or(
        `name.ilike.%${search}%,surname.ilike.%${search}%,registration_number.ilike.%${search}%`
      );
    }

    // Apply default sorting
    query = query.order('surname', {ascending: true}).order('name', {ascending: true});

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const {data, error, count} = await query;

    if (error) {
      console.error('Error fetching members:', error);
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
    console.error('Exception in getAllMembers:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

/**
 * Get internal members only
 *
 * @example
 * const result = await getInternalMembers(supabase);
 */
export async function getInternalMembers(
  supabase: SupabaseClient,
  options: {page?: number; limit?: number} = {}
): Promise<QueryResult<Member[]>> {
  return getAllMembers(supabase, {
    ...options,
    isInternal: true,
  });
}

/**
 * Get external members only
 *
 * @example
 * const result = await getExternalMembers(supabase);
 */
export async function getExternalMembers(
  supabase: SupabaseClient,
  options: {page?: number; limit?: number} = {}
): Promise<QueryResult<Member[]>> {
  return getAllMembers(supabase, {
    ...options,
    isExternal: true,
  });
}

/**
 * Get members on loan
 *
 * @example
 * const result = await getMembersOnLoan(supabase);
 */
export async function getMembersOnLoan(supabase: SupabaseClient): Promise<QueryResult<Member[]>> {
  return getAllMembers(supabase, {
    onLoan: true,
  });
}

/**
 * Get member by ID
 *
 * @example
 * const result = await getMemberById(supabase, '123');
 */
export async function getMemberById(
  supabase: SupabaseClient,
  id: string
): Promise<QueryResult<Member>> {
  try {
    const {data, error} = await supabase.from('members').select('*').eq('id', id).single();

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
  supabase: SupabaseClient,
  id: string
): Promise<QueryResult<MemberWithRelations>> {
  try {
    const {data, error} = await supabase
      .from('members')
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
  supabase: SupabaseClient,
  categoryId: string
): Promise<QueryResult<Member[]>> {
  try {
    const {data, error, count} = await supabase
      .from('members')
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
