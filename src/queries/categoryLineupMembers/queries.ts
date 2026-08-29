import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {BaseCategoryLineupMember} from '@/types';

interface GetCategoryLineupMembersOptions extends GetEntitiesOptions {
  filters?: {
    /** Column filters applied directly to `category_lineup_members` rows. */
    lineup_id?: string;
    category_id?: string;
    /**
     * Include members that were deactivated (soft-removed) in the members list.
     *
     * Defaults to `false`: a deactivated player must disappear from the rosters
     * coaches work with, while their row stays in the table so historical
     * records (past seasons, match lineups) remain intact and reactivating the
     * member brings them back to the lineup.
     */
    includeInactiveMembers?: boolean;
  };
}

/** Member columns joined into every lineup member row. */
const MEMBER_SELECT =
  '*, members!inner(id, name, surname, registration_number, category_id, is_active)';

export async function getAllCategoryLineupMembers(
  ctx: QueryContext,
  options?: GetCategoryLineupMembersOptions
): Promise<QueryResult<BaseCategoryLineupMember[]>> {
  try {
    const {includeInactiveMembers = false, ...columnFilters} = options?.filters ?? {};

    let query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      select: MEMBER_SELECT,
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: columnFilters,
    });

    // Filtering on the embedded resource works because the join is `!inner`.
    if (!includeInactiveMembers) {
      query = query.eq('members.is_active', true);
    }

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
