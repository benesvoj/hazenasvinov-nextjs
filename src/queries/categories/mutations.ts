import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {Category, CategoryInsert} from '@/types';

export async function createCategory(
  ctx: QueryContext,
  data: CategoryInsert
): Promise<QueryResult<Category>> {
  try {
    const query = buildInsertQuery(ctx.supabase, 'categories', data);
    const {data: category, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: category as unknown as Category,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in createCategory:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateCategory(
  ctx: QueryContext,
  id: string,
  data: Partial<CategoryInsert>
): Promise<QueryResult<Category>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, 'categories', id, data);
    const {data: category, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: category as unknown as Category,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in updateCategory:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteCategory(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, 'categories', id);
    const {error} = await query;

    if (error) {
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
    console.error('Exception in deleteCategory:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
