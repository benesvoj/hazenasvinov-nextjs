import {DB_TABLE, ENTITY} from '@/queries/categoryLineups';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {CategoryLineup, CreateCategoryLineup} from '@/types';

/**
 * CRUD mutations for CategoryLineups
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<CategoryLineup, CreateCategoryLineup>> | null =
  null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<CategoryLineup, CreateCategoryLineup>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createCategoryLineup = (ctx: QueryContext, data: CreateCategoryLineup) =>
  getHelpers().create(ctx, data);

export const updateCategoryLineup = (
  ctx: QueryContext,
  id: string,
  data: Partial<CreateCategoryLineup>
) => getHelpers().update(ctx, id, data);

export const deleteCategoryLineup = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
