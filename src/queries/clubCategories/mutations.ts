import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries';
import {DB_TABLE, ENTITY} from "@/queries/clubCategories";
import {QueryContext, QueryResult} from '@/queries/shared/types';
import {ClubCategoryInsert, ClubCategorySchema} from '@/types';

export async function createClubCategory(
  ctx: QueryContext,
  data: ClubCategoryInsert
): Promise<QueryResult<ClubCategorySchema>> {
  try {
    const query = buildInsertQuery(ctx.supabase, DB_TABLE, data);
    const {data: clubCategory, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: clubCategory as unknown as ClubCategorySchema,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in create${ENTITY}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function updateClubCategory(
  ctx: QueryContext,
  id: string,
  data: Partial<ClubCategoryInsert>
): Promise<QueryResult<ClubCategorySchema>> {
  try {
    const query = buildUpdateQuery(ctx.supabase, DB_TABLE, id, data);
    const {data: clubCategory, error} = await query;

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }
    return {
      data: clubCategory as unknown as ClubCategorySchema,
      error: null,
    };
  } catch (err: any) {
    console.error(`Exception in update${ENTITY}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

export async function deleteClubCategory(
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
    console.error(`Exception in delete${ENTITY}:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
