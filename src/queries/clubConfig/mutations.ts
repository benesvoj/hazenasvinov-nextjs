import {DB_TABLE, ENTITY} from '@/queries/clubConfig';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {ClubConfig, ClubConfigUpdate} from '@/types';

let helpers: ReturnType<typeof createMutationHelpers<ClubConfig, ClubConfigUpdate>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<ClubConfig, ClubConfigUpdate>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const updateClubConfig = (ctx: QueryContext, id: string, data: Partial<ClubConfigUpdate>) =>
  getHelpers().update(ctx, id, data);
