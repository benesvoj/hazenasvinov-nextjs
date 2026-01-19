import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {DB_TABLE, ENTITY} from '@/queries/videos';
import {VideoInsert, VideoSchema} from '@/types';

/**
 * CRUD mutations for videos
 * Uses memoized createMutationHelpers factory
 */

let helpers: ReturnType<typeof createMutationHelpers<VideoSchema, VideoInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<VideoSchema, VideoInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createVideo = (ctx: QueryContext, data: VideoInsert) => getHelpers().create(ctx, data);

export const updateVideo = (ctx: QueryContext, id: string, data: Partial<VideoInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteVideo = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
