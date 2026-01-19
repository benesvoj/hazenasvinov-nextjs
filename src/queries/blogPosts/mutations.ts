import {DB_TABLE, ENTITY} from '@/queries/blogPosts';
import {createMutationHelpers} from '@/queries/shared/createMutationHelpers';
import {QueryContext} from '@/queries/shared/types';
import {Blog, BlogPostInsert} from '@/types';

let helpers: ReturnType<typeof createMutationHelpers<Blog, BlogPostInsert>> | null = null;

const getHelpers = () => {
  if (!helpers) {
    helpers = createMutationHelpers<Blog, BlogPostInsert>({
      tableName: DB_TABLE,
      entityName: ENTITY.singular,
    });
  }
  return helpers;
};

export const createBlogPost = (ctx: QueryContext, data: BlogPostInsert) =>
  getHelpers().create(ctx, data);

export const updateBlogPost = (ctx: QueryContext, id: string, data: Partial<BlogPostInsert>) =>
  getHelpers().update(ctx, id, data);

export const deleteBlogPost = (ctx: QueryContext, id: string) => getHelpers().delete(ctx, id);
