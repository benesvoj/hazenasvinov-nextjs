import {SupabaseClient} from '@supabase/supabase-js';

import * as blogPostQueries from '@/queries/blogPosts';
import * as categoriesQueries from '@/queries/categories';
import * as clubCategoriesQueries from '@/queries/clubCategories';
import * as clubsQueries from '@/queries/clubs';
import * as commentsQueries from '@/queries/comments';
import * as committeeQueries from '@/queries/committees';
import * as grantQueries from '@/queries/grants';
import * as seasonQueries from '@/queries/seasons';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import * as todoQueries from '@/queries/todos';

export interface EntityQueryLayer<T = any, Options = any> {
  getAll: (ctx: QueryContext, options?: Options) => Promise<QueryResult<T[]>>;
  getById: (ctx: QueryContext, id: string) => Promise<QueryResult<T>>;
  create: (ctx: QueryContext, data: any) => Promise<QueryResult<T>>;
  update: (ctx: QueryContext, id: string, data: any) => Promise<QueryResult<T>>;
  delete: (ctx: QueryContext, id: string) => Promise<QueryResult<{success: boolean}>>;
}

export interface EntityConfig {
  tableName: string;
  sortBy?: {column: string; ascending: boolean}[];
  requiresAdmin?: boolean;

  queryLayer?: EntityQueryLayer;

  pagination?: {
    defaultLimit: number;
    maxLimit: number;
  };

  validateCreate?: (body: any) => {valid: boolean; errors?: string[]};
  validateUpdate?: (body: any) => {valid: boolean; errors?: string[]};
  customQuery?: (supabase: SupabaseClient, params: any) => any;
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  committees: {
    tableName: 'committees',
    sortBy: [{column: 'sort_order', ascending: true}],
    requiresAdmin: false,
    queryLayer: {
      getAll: committeeQueries.getAllCommittees,
      getById: committeeQueries.getCommitteeById,
      create: committeeQueries.createCommittee,
      update: committeeQueries.updateCommittee,
      delete: committeeQueries.deleteCommittee,
    },
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },
  seasons: {
    tableName: 'seasons',
    sortBy: [{column: 'start_date', ascending: false}],
    requiresAdmin: false,
    queryLayer: {
      getAll: seasonQueries.getAllSeasons,
      getById: seasonQueries.getSeasonById,
      create: seasonQueries.createSeason,
      update: seasonQueries.updateSeason,
      delete: seasonQueries.deleteSeason,
    },
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },
  categories: {
    tableName: 'categories',
    sortBy: [
      {column: 'sort_order', ascending: true},
      {column: 'name', ascending: true},
    ],
    requiresAdmin: false,
    queryLayer: {
      getAll: categoriesQueries.getAllCategories,
      getById: categoriesQueries.getCategoryById,
      create: categoriesQueries.createCategory,
      update: categoriesQueries.updateCategory,
      delete: categoriesQueries.deleteCategory,
    },
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },
  clubs: {
    tableName: 'clubs',
    sortBy: [{column: 'name', ascending: true}],
    requiresAdmin: false,
    queryLayer: {
      getAll: clubsQueries.getAllClubs,
      getById: clubsQueries.getClubById,
      create: clubsQueries.createClub,
      update: clubsQueries.updateClub,
      delete: clubsQueries.deleteClub,
    },
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },
  club_categories: {
    tableName: 'club_categories',
    sortBy: [{column: 'club_id', ascending: true}],
    requiresAdmin: false,
    queryLayer: {
      getAll: clubCategoriesQueries.getAllClubCategories,
      getById: clubCategoriesQueries.getClubCategoryById,
      create: clubCategoriesQueries.createClubCategory,
      update: clubCategoriesQueries.updateClubCategory,
      delete: clubCategoriesQueries.deleteClubCategory,
    },
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },
  grants: {
    tableName: 'grants',
    sortBy: [
      {column: 'month', ascending: false},
      {column: 'name', ascending: true},
    ],
    requiresAdmin: true,
    queryLayer: {
      getAll: grantQueries.getAllGrants,
      getById: grantQueries.getGrantById,
      create: grantQueries.createGrant,
      update: grantQueries.updateGrant,
      delete: grantQueries.deleteGrant,
    },
    pagination: {
      defaultLimit: 25,
      maxLimit: 100,
    },
  },
  blog_posts: {
    tableName: 'blog_posts',
    sortBy: [{column: 'published_at', ascending: false}],
    requiresAdmin: true,
    queryLayer: {
      getAll: blogPostQueries.getAllBlogPosts,
      getById: blogPostQueries.getBlogPostById,
      create: blogPostQueries.createBlogPost,
      update: blogPostQueries.updateBlogPost,
      delete: blogPostQueries.deleteBlogPost,
    },
  },
  comments: {
    tableName: 'comments',
    sortBy: [{column: 'created_at', ascending: false}],
    requiresAdmin: false,
    queryLayer: {
      getAll: commentsQueries.getAllComments,
      getById: commentsQueries.getCommentById,
      create: commentsQueries.createComment,
      update: commentsQueries.updateComment,
      delete: commentsQueries.deleteComment,
    },
  },
  todos: {
    tableName: 'todos',
    sortBy: [{column: 'created_at', ascending: false}],
    requiresAdmin: true,
    queryLayer: {
      getAll: todoQueries.getAllTodos,
      getById: todoQueries.getTodoById,
      create: todoQueries.createTodo,
      update: todoQueries.updateTodo,
      delete: todoQueries.deleteTodo,
    },
  },
};
