import {NextRequest} from 'next/server';

import {
  errorResponse,
  successResponse,
  withAdminAuth,
  withAuth,
  withPublicAccess,
} from '@/utils/supabase/apiHelpers';

import {ENTITY_CONFIGS} from '../config';

/**
 * GET /api/entities/[entity]
 *
 * Examples:
 * - GET /api/entities/members
 * - GET /api/entities/categories
 * - GET /api/entities/blog
 */
export async function GET(request: NextRequest, {params}: {params: Promise<{entity: string}>}) {
  const {entity} = await params;

  const config = ENTITY_CONFIGS[entity];
  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  // Handler function that both auth wrappers will use
  const handler = async (supabase: any) => {
    if (config.queryLayer) {
      const searchParams = request.nextUrl.searchParams;

      const page = searchParams.get('page');
      const limit = searchParams.get('limit');

      const filters: Record<string, any> = {};
      if (config.filters) {
        config.filters.forEach((filter) => {
          const value = searchParams.get(filter.paramName);
          if (value !== null) {
            const dbColumn = filter.dbColumn || filter.paramName;
            filters[dbColumn] = filter.transform ? filter.transform(value) : value;
          }
        });
      }

      const options = {
        sorting: config.sortBy,
        pagination:
          page || limit
            ? {
                page: page ? parseInt(page) : 1,
                limit: limit
                  ? Math.min(parseInt(limit), config.pagination?.maxLimit || 100)
                  : config.pagination?.defaultLimit || 25,
              }
            : undefined,
        filters,
      };

      if (config.queryLayer?.getOne) {
        const result = await config.queryLayer.getOne({supabase});
        if (result.error) throw new Error(result.error);
        return successResponse(result.data);
      }

      if (!config.queryLayer.getAll) {
        return errorResponse(`Entity '${entity}' does not support list queries`, 405);
      }
      const result = await config.queryLayer.getAll({supabase}, options);

      if (result.error) {
        console.error(`[Dynamic Route] Error in queryLayer.getAll for ${entity}:`, result.error);
        throw new Error(result.error);
      }

      return successResponse(result.data);
    }

    // FALLBACK: Legacy direct query for entities without query layer
    let query = supabase.from(config.tableName).select('*');

    if (config.sortBy) {
      config.sortBy.forEach((sort) => {
        query = query.order(sort.column, {ascending: sort.ascending});
      });
    }

    const {data, error} = await query;
    if (error) {
      throw error;
    }

    return successResponse(data);
  };

  // Use public access for entities marked as public, otherwise require auth
  if (config.isPublic) {
    return withPublicAccess(handler);
  }

  return withAuth(async (_user, supabase) => handler(supabase));
}

/**
 * POST /api/entities/[entity]
 *
 * Examples:
 * - POST /api/entities/members
 * - POST /api/entities/categories
 */
export async function POST(request: NextRequest, {params}: {params: Promise<{entity: string}>}) {
  const {entity} = await params;

  const config = ENTITY_CONFIGS[entity];
  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAdminAuth(async (_user, _supabase, admin) => {
    const body = await request.json();

    // Use query layer if available
    if (config.queryLayer?.create) {
      const result = await config.queryLayer.create({supabase: admin}, body);
      if (result.error) throw new Error(result.error);
      return successResponse(result.data, 201);
    }

    // Legacy direct query for entities without query layer
    const {data, error} = await admin
      .from(config.tableName)
      .insert({...body})
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
