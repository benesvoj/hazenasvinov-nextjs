import {buildDeleteQuery, buildInsertQuery, buildUpdateQuery} from '@/queries/shared/queryBuilder';
import {QueryContext, QueryResult} from '@/queries/shared/types';

/**
 * Factory function to generate CRUD mutation helpers
 * Eliminates duplicate code across mutation files
 *
 * @template TSchema - The entity schema type (e.g., Season, Video)
 * @template TInsert - The insert type (e.g., SeasonInsert, VideoInsert)
 *
 * @param config - Configuration object
 * @param config.tableName - Database table name
 * @param config.entityName - Entity name for error messages (singular, e.g., 'Season', 'Video')
 *
 * @returns Object with create, update, delete functions
 *
 */
export function createMutationHelpers<TSchema, TInsert extends Record<string, any>>(config: {
  tableName: string;
  entityName: string;
}) {
  const {tableName, entityName} = config;

  return {
    /**
     * Create a new entity
     */
    create: async (ctx: QueryContext, data: TInsert): Promise<QueryResult<TSchema>> => {
      try {
        const query = buildInsertQuery(ctx.supabase, tableName, data);
        const {data: item, error} = await query;

        if (error) {
          return {
            data: null,
            error: error.message,
          };
        }

        return {
          data: item as unknown as TSchema,
          error: null,
        };
      } catch (err: any) {
        console.error(`Exception in create${entityName}:`, err);
        return {
          data: null,
          error: err.message || 'Unknown error',
        };
      }
    },

    /**
     * Update an existing entity
     */
    update: async (
      ctx: QueryContext,
      id: string,
      data: Partial<TInsert>
    ): Promise<QueryResult<TSchema>> => {
      try {
        const query = buildUpdateQuery(ctx.supabase, tableName, id, data);
        const {data: item, error} = await query;

        if (error) {
          return {
            data: null,
            error: error.message,
          };
        }

        return {
          data: item as unknown as TSchema,
          error: null,
        };
      } catch (err: any) {
        console.error(`Exception in update${entityName}:`, err);
        return {
          data: null,
          error: err.message || 'Unknown error',
        };
      }
    },

    /**
     * Delete an entity
     */
    delete: async (ctx: QueryContext, id: string): Promise<QueryResult<{success: boolean}>> => {
      try {
        const query = buildDeleteQuery(ctx.supabase, tableName, id);
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
        console.error(`Exception in delete${entityName}:`, err);
        return {
          data: null,
          error: err.message || 'Unknown error',
        };
      }
    },
  };
}
