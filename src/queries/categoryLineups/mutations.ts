import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/categoryLineups';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {CategoryLineup, CreateCategoryLineup} from '@/types';

export async function createCategoryLineup(
  ctx: QueryContext,
  data: CreateCategoryLineup
): Promise<QueryResult<CategoryLineup>> {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    const {data: lineup, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: lineup as unknown as CategoryLineup,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in create${ENTITY.singular}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateCategoryLineup(
  ctx: QueryContext,
  id: string,
  data: Partial<CreateCategoryLineup>
): Promise<QueryResult<CategoryLineup>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
    const {data: lineup, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: lineup as unknown as CategoryLineup,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in update${ENTITY.singular}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteCategoryLineup(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{success: boolean}>> {
  try {
    const query = buildDeleteQuery(ctx.supabase, DB_TABLE, id);
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
    console.error(`Exception in delete${ENTITY.singular}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
