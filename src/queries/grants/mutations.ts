import {DB_TABLE, ENTITY} from '@/queries/grants';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Grant, GrantInsert} from '@/types';

/**
 * CRUD mutations for Grants
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<Grant, GrantInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Grant, GrantInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createGrant = (ctx: QueryContext, data: GrantInsert) => getHelpers().create(ctx, data);

export const updateGrant = (ctx: QueryContext, id: string, data: Partial<GrantInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteGrant = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
