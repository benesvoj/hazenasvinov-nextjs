import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/trainingSessions';
import {BaseTrainingSession, TrainingSessionInsert} from '@/types';

/**
 * CRUD mutations for TrainingSessions
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<
  typeof createMutationHelpers<BaseTrainingSession, TrainingSessionInsert>
> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<BaseTrainingSession, TrainingSessionInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createTrainingSession = (ctx: QueryContext, data: TrainingSessionInsert) =>
  getHelpers().create(ctx, data);

export const updateTrainingSession = (
  ctx: QueryContext,
  id: string,
  data: Partial<TrainingSessionInsert>
) => getHelpers().update(ctx, id, data);

export const deleteTrainingSession = (ctx: QueryContext, id: string) =>
  getHelpers().delete(ctx, id);
