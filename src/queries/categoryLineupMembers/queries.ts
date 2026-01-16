import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {BaseCategoryLineupMember} from '@/types';

interface GetCategoryLineupMembersOptions extends GetEntitiesOptions {
  filters?: {
    categoryId?: string;
    lineupId?: string;
    includeMemberDetails: boolean;
  };
}

export async function getAllCategoryLineupMembers(
  ctx: QueryContext,
  options?: GetCategoryLineupMembersOptions
): Promise<QueryResult<BaseCategoryLineupMember[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<BaseCategoryLineupMember>(error, count);
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as BaseCategoryLineupMember[],
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

export async function getCategoryLineupMemberById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<BaseCategoryLineupMember>> {
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
      data: data as unknown as BaseCategoryLineupMember,
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
