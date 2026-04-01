import {SupabaseClient} from '@supabase/supabase-js';

import * as blogPostQueries from '@/queries/blogPosts';
import * as categoriesQueries from '@/queries/categories';
import * as categoryLineupMembersQueries from '@/queries/categoryLineupMembers';
import * as categoryLineupQueries from '@/queries/categoryLineups';
import * as clubCategoriesQueries from '@/queries/clubCategories';
import * as clubConfigQueries from '@/queries/clubConfig';
import * as clubsQueries from '@/queries/clubs';
import * as commentsQueries from '@/queries/comments';
import * as committeeQueries from '@/queries/committees';
import * as grantQueries from '@/queries/grants';
import * as memberAttendanceQueries from '@/queries/memberAttendance';
import * as roleDefinitionsQueries from '@/queries/roleDefinitions';
import * as seasonQueries from '@/queries/seasons';
import {QueryContext, QueryResult} from '@/queries/shared/types';
import * as todoQueries from '@/queries/todos';
import * as tournamentsQueries from '@/queries/tournaments';
import * as trainingSessionsQueries from '@/queries/trainingSessions';
import * as userQueries from '@/queries/users';

export interface EntityQueryLayer<T = any, Options = any> {
  getAll?: (ctx: QueryContext, options?: Options) => Promise<QueryResult<T[]>>;
  getOne?: (ctx: QueryContext) => Promise<QueryResult<T>>;
  getById?: (ctx: QueryContext, id: string) => Promise<QueryResult<T>>;
  create?: (ctx: QueryContext, data: any) => Promise<QueryResult<T>>;
  update?: (ctx: QueryContext, id: string, data: any) => Promise<QueryResult<T>>;
  delete?: (ctx: QueryContext, id: string) => Promise<QueryResult<{success: boolean}>>;
}

export interface EntityConfig {
  tableName: string;
  sortBy?: {column: string; ascending: boolean}[];
  requiresAdmin?: boolean;
  coachWritable?: boolean;
  isPublic?: boolean; // If true, endpoint is accessible without authentication

  queryLayer?: EntityQueryLayer;

  pagination?: {
    defaultLimit: number;
    maxLimit: number;
  };
  filters?: {
    paramName: string;
    dbColumn?: string;
    transform?: (value: string) => any;
  }[];

  /** Resolve category_id for coach access check. Default: body.category_id.
   *  Use for relation tables where category_id is on a parent row. */
  categoryResolver?: (supabase: SupabaseClient, body: any) => Promise<string | null>;

  validateCreate?: (body: any) => {valid: boolean; errors?: string[]};
  validateUpdate?: (body: any) => {valid: boolean; errors?: string[]};
  customQuery?: (supabase: SupabaseClient, params: any) => any;
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  committees: {
    tableName: committeeQueries.DB_TABLE,
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
    tableName: seasonQueries.DB_TABLE,
    sortBy: [{column: 'start_date', ascending: false}],
    requiresAdmin: false,
    isPublic: true, // Accessible on landing page without auth
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
    tableName: categoriesQueries.DB_TABLE,
    sortBy: [
      {column: 'sort_order', ascending: true},
      {column: 'name', ascending: true},
    ],
    requiresAdmin: false,
    isPublic: true, // Accessible on landing page without auth
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
    tableName: clubsQueries.DB_TABLE,
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
    tableName: clubCategoriesQueries.DB_TABLE,
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
  club_config: {
    tableName: clubConfigQueries.DB_TABLE,
    requiresAdmin: true,
    queryLayer: {
      getOne: clubConfigQueries.getClubConfig, // Only one config record expected, so getAll returns the config
      update: clubConfigQueries.updateClubConfig,
    },
  },
  grants: {
    tableName: grantQueries.DB_TABLE,
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
    tableName: blogPostQueries.DB_TABLE,
    sortBy: [{column: 'published_at', ascending: false}],
    requiresAdmin: true, // Write operations require admin
    isPublic: true, // Read operations are public (for blog listing page)
    queryLayer: {
      getAll: blogPostQueries.getAllBlogPosts,
      getById: blogPostQueries.getBlogPostById,
      create: blogPostQueries.createBlogPost,
      update: blogPostQueries.updateBlogPost,
      delete: blogPostQueries.deleteBlogPost,
    },
  },
  comments: {
    tableName: commentsQueries.DB_TABLE,
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
    tableName: todoQueries.DB_TABLE,
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
  training_sessions: {
    tableName: trainingSessionsQueries.DB_TABLE,
    sortBy: [
      {column: 'session_date', ascending: false},
      {column: 'session_time', ascending: false},
    ],
    filters: [
      {paramName: 'categoryId', dbColumn: 'category_id'},
      {paramName: 'seasonId', dbColumn: 'season_id'},
    ],
    requiresAdmin: false,
    queryLayer: {
      getAll: trainingSessionsQueries.getAllTrainingSessions,
      getById: trainingSessionsQueries.getTrainingSessionById,
      create: trainingSessionsQueries.createTrainingSession,
      update: trainingSessionsQueries.updateTrainingSession,
      delete: trainingSessionsQueries.deleteTrainingSession,
    },
  },
  member_attendance: {
    tableName: memberAttendanceQueries.DB_TABLE,
    sortBy: [{column: 'member_id', ascending: false}],
    requiresAdmin: false,
    filters: [{paramName: 'trainingSessionId', dbColumn: 'training_session_id'}],
    queryLayer: {
      getAll: memberAttendanceQueries.getAllMembersOfTrainingSession,
    },
  },
  category_lineups: {
    tableName: categoryLineupQueries.DB_TABLE,
    sortBy: [{column: 'name', ascending: true}],
    requiresAdmin: false,
    coachWritable: true,
    filters: [
      {paramName: 'categoryId', dbColumn: 'category_id'},
      {paramName: 'seasonId', dbColumn: 'season_id'},
    ],
    queryLayer: {
      getAll: categoryLineupQueries.getAllCategoryLineups,
      getById: categoryLineupQueries.getCategoryLineupById,
      create: categoryLineupQueries.createCategoryLineup,
      update: categoryLineupQueries.updateCategoryLineup,
      delete: categoryLineupQueries.deleteCategoryLineup,
    },
  },
  category_lineup_members: {
    tableName: categoryLineupMembersQueries.DB_TABLE,
    sortBy: [{column: 'jersey_number', ascending: true}],
    requiresAdmin: false,
    coachWritable: true,
    categoryResolver: async (supabase, body) => {
      if (!body.lineup_id) return null;
      const {data} = await supabase
        .from('category_lineups')
        .select('category_id')
        .eq('id', body.lineup_id)
        .single();
      return data?.category_id ?? null;
    },
    filters: [{paramName: 'lineupId', dbColumn: 'lineup_id'}],
    queryLayer: {
      getAll: categoryLineupMembersQueries.getAllCategoryLineupMembers,
      getById: categoryLineupMembersQueries.getCategoryLineupMemberById,
      create: categoryLineupMembersQueries.createCategoryLineupMember,
      update: categoryLineupMembersQueries.updateCategoryLineupMember,
      delete: categoryLineupMembersQueries.deleteCategoryLineupMember,
    },
  },
  role_definitions: {
    tableName: roleDefinitionsQueries.DB_TABLE,
    sortBy: [{column: 'name', ascending: true}],
    requiresAdmin: true,
    queryLayer: {
      getAll: roleDefinitionsQueries.getAllRoleDefinitions,
      getById: roleDefinitionsQueries.getRoleDefinitionById,
    },
  },
  users: {
    tableName: userQueries.DB_TABLE,
    sortBy: [{column: 'email', ascending: true}],
    requiresAdmin: true,
    queryLayer: {
      getAll: userQueries.getAllUsers,
    },
  },
  tournaments: {
    tableName: tournamentsQueries.DB_TABLE,
    sortBy: [{column: 'start_date', ascending: false}],
    requiresAdmin: false,
    isPublic: true,
    queryLayer: {
      getAll: tournamentsQueries.getAllTournaments,
      getById: tournamentsQueries.getTournamentById,
      create: tournamentsQueries.createTournament,
      update: tournamentsQueries.updateTournament,
      delete: tournamentsQueries.deleteTournament,
    },
    pagination: {defaultLimit: 25, maxLimit: 100},
  },
};
