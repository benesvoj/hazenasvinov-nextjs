import {DB_TABLE, ENTITY} from '@/queries/comments';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {BaseComment, CommentInsert} from '@/types';

/**
 * CRUD mutations for Comments
 * Uses memoized createMutationHelpers factory
 */

// Memoized helper instance
let helpers: ReturnType<typeof createMutationHelpers<BaseComment, CommentInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<BaseComment, CommentInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

// Export mutation functions
export const createComment = (ctx: QueryContext, data: CommentInsert) =>
  getHelpers().create(ctx, data);

export const updateComment = (ctx: QueryContext, id: string, data: Partial<CommentInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteComment = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
