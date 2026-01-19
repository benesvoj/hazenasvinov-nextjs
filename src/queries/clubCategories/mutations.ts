import {DB_TABLE, ENTITY} from '@/queries/clubCategories';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {ClubCategoryInsert, ClubCategorySchema} from '@/types';

/**
 * CRUD mutations for ClubCategories
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<
  typeof createMutationHelpers<ClubCategorySchema, ClubCategoryInsert>
> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<ClubCategorySchema, ClubCategoryInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createClubCategory = (ctx: QueryContext, data: ClubCategoryInsert) =>
  getHelpers().create(ctx, data);

export const updateClubCategory = (
  ctx: QueryContext,
  id: string,
  data: Partial<ClubCategoryInsert>
) => getHelpers().update(ctx, id, data);

export const deleteClubCategory = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
