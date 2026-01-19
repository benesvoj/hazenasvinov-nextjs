import {DB_TABLE, ENTITY} from '@/queries/clubs';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Club, ClubInsert} from '@/types';

/**
 * CRUD mutations for Club
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<Club, ClubInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Club, ClubInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createClub = (ctx: QueryContext, data: ClubInsert) => getHelpers().create(ctx, data);

export const updateClub = (ctx: QueryContext, id: string, data: Partial<ClubInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteClub = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
