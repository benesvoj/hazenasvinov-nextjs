import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {Category} from '@/types';

export async function getAllCategories(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<Category[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, 'categories', {
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
    console.error('Exception in getAllCategories:', err);
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
    const query = buildSelectOneQuery(ctx.supabase, 'categories', id);

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching category:', error);
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
    console.error('Exception in getCategoryById:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
