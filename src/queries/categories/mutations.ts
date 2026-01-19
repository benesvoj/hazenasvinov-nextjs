import {DB_TABLE, ENTITY} from '@/queries/categories';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Category, CategoryInsert} from '@/types';

/**
 * CRUD mutations for Categories
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<Category, CategoryInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Category, CategoryInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createCategory = (ctx: QueryContext, data: CategoryInsert) =>
  getHelpers().create(ctx, data);

export const updateCategory = (ctx: QueryContext, id: string, data: Partial<CategoryInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteCategory = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
