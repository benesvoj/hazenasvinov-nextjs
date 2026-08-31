import {withClientQueryList} from '@/utils/supabase/queryHelpers';

import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/categories';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {Category} from '@/types';

/**
 * Categories the own club actually fields in the active season.
 *
 * The public site used to list every row in `categories`, so a category the
 * club is not entering — Ženy in 2026/2027 — still got a tab on the home page
 * and a page in the menu, both of which then rendered an empty table.
 *
 * The truth lives in `club_categories`: a row per club, category and season,
 * written when the category is entered. `categories.is_active` is not it — the
 * public site never read it, and it says nothing about a particular season —
 * and neither is `category_seasons`, which holds no rows for the active season
 * and is being removed.
 *
 * Ordering matches getAllCategories so tabs do not jump around.
 */
export async function getOwnClubActiveSeasonCategories(
  ctx: QueryContext
): Promise<QueryResult<Category[]>> {
  try {
    const {data, error} = await ctx.supabase
      .from('club_categories')
      .select('categories!inner(*), clubs!inner(is_own_club), seasons!inner(is_active)')
      .eq('is_active', true)
      .eq('clubs.is_own_club', true)
      .eq('seasons.is_active', true);

    if (error) {
      console.error('Error fetching own club categories for the active season:', error);
      return {data: null, error: error.message, count: 0};
    }

    // A club can field several teams in one category (A/B), so the same
    // category comes back more than once.
    const byId = new Map<string, Category>();
    for (const row of (data ?? []) as unknown as {categories: Category}[]) {
      if (row.categories?.id) byId.set(row.categories.id, row.categories);
    }

    const categories = [...byId.values()].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, 'cs')
    );

    return {data: categories, error: null, count: categories.length};
  } catch (err: any) {
    console.error('Exception in getOwnClubActiveSeasonCategories:', err);
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}

export async function getAllCategories(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Category[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<Category>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as Category[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getCategoryById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<Category>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);

    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY.singular}:`, error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as Category,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ById:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Client-side fetch function for React Query
 * Use with useQuery in client components
 */
export const fetchCategories = withClientQueryList<Category>((supabase) =>
  supabase
    .from(DB_TABLE)
    .select('*')
    .order('sort_order', {ascending: true})
    .order('name', {ascending: true})
);
