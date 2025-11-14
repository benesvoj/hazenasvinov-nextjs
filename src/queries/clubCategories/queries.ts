import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {ClubCategorySchema, ClubCategoryWithRelations} from '@/types';

export async function getAllClubCategories(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<ClubCategoryWithRelations[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, 'club_categories', {
      select: `
          *,
          club:clubs(id, name, logo_url),
          category:categories(id, name),
          season:seasons(id, name)
        `,
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    // Handle malformed Supabase error (bug when pagination is beyond available records)
    const paginationBugResult = handleSupabasePaginationBug<ClubCategoryWithRelations>(
      error,
      count
    );
    if (paginationBugResult) {
      return paginationBugResult;
    }

    return {
      data: data as unknown as ClubCategoryWithRelations[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in getAllClubCategories', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

export async function getClubCategoryById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<ClubCategorySchema>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, 'club_categories', id);

    const {data, error} = await query;

    if (error) {
      console.error('Error fetching club category:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as ClubCategorySchema,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getClubCategoryById:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
