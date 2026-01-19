import {DB_TABLE, ENTITY} from '@/queries/committees';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Committee, CommitteeInsert} from '@/types';

/**
 * CRUD mutations for Committees
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<Committee, CommitteeInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Committee, CommitteeInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createCommittee = (ctx: QueryContext, data: CommitteeInsert) =>
  getHelpers().create(ctx, data);

export const updateCommittee = (ctx: QueryContext, id: string, data: Partial<CommitteeInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteCommittee = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
