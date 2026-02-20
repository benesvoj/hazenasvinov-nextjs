import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {CoachCard, CoachCardWithCategories} from '@/types';

import {DB_TABLE, ENTITY} from './constants';

interface GetCoachCardsOptions extends GetEntitiesOptions {
  filters?: {
    user_id?: string;
    /**
     * Filter by cards published to a specific category
     */
    published_categories?: string;
  };
}

/**
 *  Get all coach cards with optional filtering
 */
export async function getAllCoachCards(
  ctx: QueryContext,
  options?: GetCoachCardsOptions
): Promise<QueryResult<CoachCard[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      filters: options?.filters,
      sorting: options?.sorting,
      pagination: options?.pagination,
    });

    const {data, error, count} = await query;

    const paginationBugResult = handleSupabasePaginationBug<CoachCard>(error, count);
    if (paginationBugResult) return paginationBugResult;

    return {
      data: data as unknown as CoachCard[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}

/**
 *  GET a single coach card by ID
 */
export async function getCoachCardById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<CoachCard>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);
    const {data, error} = await query;

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as unknown as CoachCard, error: null};
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ById:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 *  Get coach card by user ID
 */
export async function getCoachCardByUserId(
  ctx: QueryContext,
  userId: string
): Promise<QueryResult<CoachCard>> {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return {data: null, error: error.message};
    }

    return {data: data as unknown as CoachCard, error: null};
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ByUserId:`, err);
    return {data: null, error: err.message || 'Unknown error'};
  }
}

/**
 * Get coach cards published to a specific category (server-side)
 * Uses the view that joins with user_profiles
 *
 * Filters by:
 * - published_categories contains the given categoryId (card is published to this category)
 */
export async function getPublishedCoachCadsByCategory(
  ctx: QueryContext,
  categoryId: string
): Promise<QueryResult<CoachCardWithCategories[]>> {
  try {
    const {data, error} = await ctx.supabase
      .from('coach_cards_with_categories')
      .select('*')
      .contains('published_categories', [categoryId]);

    if (error) {
      return {data: null, error: error.message, count: 0};
    }

    return {
      data: data as unknown as CoachCardWithCategories[],
      error: null,
      count: data?.length ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getPublishedCoachCadsByCategory:`, err);
    return {data: null, error: err.message || 'Unknown error', count: 0};
  }
}
