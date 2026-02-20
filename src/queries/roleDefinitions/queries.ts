import {buildSelectOneQuery, buildSelectQuery, handleSupabasePaginationBug} from '@/queries';
import {DB_TABLE, ENTITY} from '@/queries/roleDefinitions/constants';
import {GetEntitiesOptions, QueryContext, QueryResult} from '@/queries/shared/types';
import {RoleDefinitionSchema} from '@/types';

export async function getAllRoleDefinitions(
  ctx: QueryContext,
  options?: GetEntitiesOptions
): Promise<QueryResult<RoleDefinitionSchema[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      sorting: options?.sorting,
      pagination: options?.pagination,
      filters: options?.filters,
    });

    const {data, error, count} = await query;

    const paginationBugResult = handleSupabasePaginationBug<RoleDefinitionSchema>(error, count);
    if (paginationBugResult) return paginationBugResult;

    return {
      data: data as unknown as RoleDefinitionSchema[],
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

export async function getRoleDefinitionById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<RoleDefinitionSchema>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);

    const {data, error, count} = await query;

    if (error) {
      console.error(`Error fetching ${ENTITY.singular}:`, error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as unknown as RoleDefinitionSchema,
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

export async function getDefaultRoleId(
  ctx: QueryContext,
  defaultRoleName: string = 'member'
): Promise<QueryResult<string>> {
  try {
    const {data, error} = await ctx.supabase
      .from(DB_TABLE)
      .select('id')
      .eq('name', defaultRoleName)
      .eq('is_active', true)
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data.id,
      error: null,
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
