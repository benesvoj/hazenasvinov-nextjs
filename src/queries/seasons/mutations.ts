import {DB_TABLE, ENTITY} from '@/queries/seasons';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Season, SeasonInsert} from '@/types';

/**
 * CRUD mutations for seasons
 * Uses memoized createMutationHelpers factory
 */

let helpers: ReturnType<typeof createMutationHelpers<Season, SeasonInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Season, SeasonInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createSeason = (ctx: QueryContext, data: SeasonInsert) =>
  getHelpers().create(ctx, data);

export const updateSeason = (ctx: QueryContext, id: string, data: Partial<SeasonInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteSeason = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
