import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {CreateTournament, Tournament, UpdateTournament} from '@/types';

import {DB_TABLE, ENTITY} from './constants';

let helpers: ReturnType<typeof createMutationHelpers<Tournament, CreateTournament>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Tournament, CreateTournament>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createTournament = (ctx: QueryContext, data: CreateTournament) =>
  getHelpers().create(ctx, data);

export const updateTournament = (ctx: QueryContext, id: string, data: Partial<UpdateTournament>) =>
  getHelpers().update(ctx, id, data);

export const deleteTournament = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
