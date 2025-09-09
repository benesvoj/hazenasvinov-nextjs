import { createClient as createServerClient } from '@/utils/supabase/server';

export interface BatchedQuery {
  id: string;
  query: () => Promise<any>;
}

export interface BatchedResult<T = any> {
  id: string;
  data: T | null;
  error: any;
}

/**
 * Client-side request batching utility for Supabase
 * Groups multiple queries and executes them in parallel
 */
export class SupabaseBatcher {
  private queries: BatchedQuery[] = [];

  addQuery<T = any>(id: string, queryFn: () => Promise<{ data: T | null; error: any }>): this {
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
          return {
            id: query.id,
            data: null,
            error
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: this.queries[index].id,
          data: null,
          error: result.reason
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
  private supabaseClientFactory: () => Promise<any>;

  constructor(supabaseClientFactory?: () => Promise<any>) {
    this.supabaseClientFactory = supabaseClientFactory || createServerClient;
  }

  addQuery<T = any>(id: string, queryFn: (supabase: any) => Promise<{ data: T | null; error: any }>): this {
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
          return {
            id: query.id,
            data: null,
            error
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: this.queries[index].id,
          data: null,
          error: result.reason
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
export function createServerBatcher(supabaseClientFactory?: () => Promise<any>): SupabaseServerBatcher {
  return new SupabaseServerBatcher(supabaseClientFactory);
}

/**
 * Example usage:
 * 
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
 */
