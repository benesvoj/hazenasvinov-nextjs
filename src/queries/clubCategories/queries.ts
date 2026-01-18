import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from "@/queries/clubCategories";
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {ClubCategorySchema, ClubCategoryWithRelations} from '@/types';

export async function getAllClubCategories(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<ClubCategoryWithRelations[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
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
    console.error(`Exception in getAll${ENTITY.plural}`, err);
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
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);

    const {data, error} = await query;

    if (error) {
      console.error(`Error fetching club ${ENTITY.singular}:`, error);
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
    console.error(`Exception in get${ENTITY.singular}ById:`, err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
