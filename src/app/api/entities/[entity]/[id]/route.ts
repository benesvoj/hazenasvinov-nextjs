import {NextRequest} from 'next/server';

import {successResponse, withAuth, withAdminAuth, errorResponse} from '@/utils/supabase/apiHelpers';

import {ENTITY_CONFIGS} from '../../config';

/**
 * GET /api/entities/[entity]/[id]
 *
 * Examples:
 * - GET /api/entities/members/123
 * - GET /api/entities/categories/456
 */
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{entity: string; id: string}>}
) {
  const {entity, id} = await params;
  const config = ENTITY_CONFIGS[entity];

  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAuth(async (user, supabase) => {
    if (config.queryLayer) {
      const result = await config.queryLayer.getById({supabase}, id);

      if (result.error) {
        throw new Error(result.error);
      }

      return successResponse(result.data);
    }

    // FALLBACK: Legacy direct query for entities without query layer
    const {data, error} = await supabase.from(config.tableName).select('*').eq('id', id).single();

    if (error) throw error;
    if (!data) {
      return errorResponse(`${entity} not found`, 404);
    }

    return successResponse(data);
  });
}

/**
 * PUT /api/entities/[entity]/[id]
 *
 * Examples:
 * - PUT /api/entities/members/123
 * - PUT /api/entities/categories/456
 */
export async function PUT(
  request: NextRequest,
  {params}: {params: Promise<{entity: string; id: string}>}
) {
  const {entity, id} = await params;
  const config = ENTITY_CONFIGS[entity];

  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();

    if (config.queryLayer) {
      const result = await config.queryLayer.update({supabase: admin}, id, body);

      if (result.error) {
        throw new Error(result.error);
      }

      return successResponse(result.data);
    }

    // FALLBACK: Legacy direct query for entities without query layer
    const {data, error} = await admin
      .from(config.tableName)
      .update({...body, updated_at: new Date().toISOString()})
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data);
  });
}

/**
 * PATCH /api/entities/[entity]/[id]
 *
 * Partial update (same implementation as PUT for simplicity)
 *
 * Examples:
 * - PATCH /api/entities/members/123
 * - PATCH /api/entities/categories/456
 */
export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{entity: string; id: string}>}
) {
  const {entity, id} = await params;
  const config = ENTITY_CONFIGS[entity];

  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();

    if (config.queryLayer) {
      const result = await config.queryLayer.update({supabase: admin}, id, body);

      if (result.error) {
        throw new Error(result.error);
      }

      return successResponse(result.data);
    }

    // FALLBACK: Legacy direct query for entities without query layer
    const {data, error} = await admin
      .from(config.tableName)
      .update({...body, updated_at: new Date().toISOString()})
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return successResponse(data);
  });
}

/**
 * DELETE /api/entities/[entity]/[id]
 *
 * Examples:
 * - DELETE /api/entities/members/123
 * - DELETE /api/entities/categories/456
 */
export async function DELETE(
  request: NextRequest,
  {params}: {params: Promise<{entity: string; id: string}>}
) {
  const {entity, id} = await params;
  const config = ENTITY_CONFIGS[entity];

  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAdminAuth(async (user, supabase, admin) => {
    if (config.queryLayer) {
      const result = await config.queryLayer.delete({supabase: admin}, id);

      if (result.error) {
        throw new Error(result.error);
      }

      return successResponse({success: true});
    }

    // FALLBACK: Legacy direct query for entities without query layer
    const {error} = await admin.from(config.tableName).delete().eq('id', id);

    if (error) {
      throw error;
    }

    return successResponse({success: true});
  });
}
