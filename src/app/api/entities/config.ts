import {SupabaseClient} from '@supabase/supabase-js';

import * as committeeQueries from '@/queries/committees';
import {QueryContext, QueryResult} from '@/queries/shared/types';

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
};

// Helper function to get entity config
export function getEntityConfig(entity: string): EntityConfig | null {
  return ENTITY_CONFIGS[entity] || null;
}

// Helper to validate entity exists
export function isValidEntity(entity: string): boolean {
  return entity in ENTITY_CONFIGS;
}
