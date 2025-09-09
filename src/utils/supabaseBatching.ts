import { createClient as createServerClient } from '@/utils/supabase/server';

/**
 * Standard error interface for Supabase operations
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Generic Supabase client type for batching operations
 * This provides type safety while remaining flexible for different Supabase client implementations
 */
export type SupabaseClient = {
  from(table: string): any;
  auth?: any;
} & Record<string, any>;

/**
 * Query function type for batched operations
 */
export type BatchedQueryFunction<T = any> = () => Promise<{ data: T | null; error: SupabaseError | null }>;

export interface BatchedQuery {
  id: string;
  query: BatchedQueryFunction;
}

export interface BatchedResult<T = any> {
  id: string;
  data: T | null;
  error: SupabaseError | null;
}

/**
 * Client-side request batching utility for Supabase
 * Groups multiple queries and executes them in parallel
 */
export class SupabaseBatcher {
  private queries: BatchedQuery[] = [];

  addQuery<T = any>(id: string, queryFn: BatchedQueryFunction<T>): this {
    this.queries.push({
      id,
      query: queryFn
    });
    return this;
  }

  async execute(): Promise<BatchedResult[]> {
    const results = await Promise.allSettled(
      this.queries.map(async (query) => {
        try {
          const result = await query.query();
          return {
            id: query.id,
            data: result.data,
            error: result.error
          };
        } catch (error) {
          // Convert caught errors to SupabaseError format
          const supabaseError: SupabaseError = {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            details: error instanceof Error ? error.stack : undefined,
            code: 'UNKNOWN_ERROR'
          };
          return {
            id: query.id,
            data: null,
            error: supabaseError
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Convert rejected promises to SupabaseError format
        const supabaseError: SupabaseError = {
          message: result.reason instanceof Error ? result.reason.message : 'Promise rejected',
          details: result.reason instanceof Error ? result.reason.stack : undefined,
          code: 'PROMISE_REJECTED'
        };
        return {
          id: this.queries[index].id,
          data: null,
          error: supabaseError
        };
      }
    });
  }

  clear(): this {
    this.queries = [];
    return this;
  }
}

/**
 * Server-side request batching utility for Supabase
 */
export class SupabaseServerBatcher {
  private queries: BatchedQuery[] = [];
  private supabaseClientFactory: () => Promise<SupabaseClient>;

  constructor(supabaseClientFactory?: () => Promise<SupabaseClient>) {
    this.supabaseClientFactory = supabaseClientFactory || createServerClient;
  }

  addQuery<T = any>(id: string, queryFn: (supabase: SupabaseClient) => Promise<{ data: T | null; error: SupabaseError | null }>): this {
    this.queries.push({
      id,
      query: async () => {
        const supabase = await this.supabaseClientFactory();
        return queryFn(supabase);
      }
    });
    return this;
  }

  async execute(): Promise<BatchedResult[]> {
    const results = await Promise.allSettled(
      this.queries.map(async (query) => {
        try {
          const result = await query.query();
          return {
            id: query.id,
            data: result.data,
            error: result.error
          };
        } catch (error) {
          // Convert caught errors to SupabaseError format
          const supabaseError: SupabaseError = {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            details: error instanceof Error ? error.stack : undefined,
            code: 'UNKNOWN_ERROR'
          };
          return {
            id: query.id,
            data: null,
            error: supabaseError
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Convert rejected promises to SupabaseError format
        const supabaseError: SupabaseError = {
          message: result.reason instanceof Error ? result.reason.message : 'Promise rejected',
          details: result.reason instanceof Error ? result.reason.stack : undefined,
          code: 'PROMISE_REJECTED'
        };
        return {
          id: this.queries[index].id,
          data: null,
          error: supabaseError
        };
      }
    });
  }

  clear(): this {
    this.queries = [];
    return this;
  }
}

/**
 * Utility function to create a batcher instance
 */
export function createBatcher(): SupabaseBatcher {
  return new SupabaseBatcher();
}

/**
 * Utility function to create a server batcher instance
 */
export function createServerBatcher(supabaseClientFactory?: () => Promise<SupabaseClient>): SupabaseServerBatcher {
  return new SupabaseServerBatcher(supabaseClientFactory);
}

/**
 * Example usage:
 * 
 * // Client-side batching
 * const batcher = createBatcher();
 * batcher
 *   .addQuery('categories', () => supabase.from('categories').select('*'))
 *   .addQuery('seasons', () => supabase.from('seasons').select('*'))
 *   .addQuery('matches', () => supabase.from('matches').select('*'));
 * 
 * const results = await batcher.execute();
 * const categories = results.find(r => r.id === 'categories')?.data;
 * const seasons = results.find(r => r.id === 'seasons')?.data;
 * const matches = results.find(r => r.id === 'matches')?.data;
 * 
 * // Server-side batching with type safety
 * const serverBatcher = createServerBatcher();
 * serverBatcher
 *   .addQuery('users', (supabase) => supabase.from('users').select('id, name, email'))
 *   .addQuery('posts', (supabase) => supabase.from('posts').select('*').eq('published', true));
 * 
 * const serverResults = await serverBatcher.execute();
 */
