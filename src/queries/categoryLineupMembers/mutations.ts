import {DB_TABLE, ENTITY} from '@/queries/categoryLineupMembers';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {BaseCategoryLineupMember, CategoryLineupMemberInsert} from '@/types';

/**
 * CRUD mutations for CategoryLineupMember
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<
  typeof createMutationHelpers<BaseCategoryLineupMember, CategoryLineupMemberInsert>
> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<BaseCategoryLineupMember, CategoryLineupMemberInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createCategoryLineupMember = (ctx: QueryContext, data: CategoryLineupMemberInsert) =>
  getHelpers().create(ctx, data);

export const updateCategoryLineupMember = (
  ctx: QueryContext,
  id: string,
  data: Partial<CategoryLineupMemberInsert>
) => getHelpers().update(ctx, id, data);

export const deleteCategoryLineupMember = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);
