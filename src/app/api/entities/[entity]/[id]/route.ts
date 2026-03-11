import {NextRequest, NextResponse} from 'next/server';

import supabaseAdmin from '@/utils/supabase/admin';
import {errorResponse, successResponse, withAdminAuth, withAuth} from '@/utils/supabase/apiHelpers';
import {hasCategoryAccess, hasCoachRole, isAdmin} from '@/utils/supabase/coachAuth';

import {EntityConfig, ENTITY_CONFIGS} from '../../config';

/**
 * Resolve category_id for coach access check on an existing record.
 * Uses categoryResolver if defined, otherwise reads category_id directly from the row.
 */
async function resolveCategoryForExisting(
  config: EntityConfig,
  supabase: any,
  id: string
): Promise<{categoryId: string | null; notFound: boolean}> {
  if (config.categoryResolver) {
    // Fetch the full row so the resolver can read related fields (e.g. lineup_id)
    const {data: existing} = await supabase
      .from(config.tableName)
      .select('*')
      .eq('id', id)
      .single();
    if (!existing) return {categoryId: null, notFound: true};
    const categoryId = await config.categoryResolver(supabase, existing);
    return {categoryId, notFound: false};
  }

  // Default: read category_id directly from the row
  const {data: existing} = await supabase
    .from(config.tableName)
    .select('category_id')
    .eq('id', id)
    .single();
  if (!existing) return {categoryId: null, notFound: true};
  return {categoryId: existing.category_id, notFound: false};
}

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
    if (!config.queryLayer?.getById) {
      return NextResponse.json({error: 'getById not supported for this entity'}, {status: 400});
    }

    if (config.queryLayer?.getOne) {
      const result = await config.queryLayer.getOne({supabase});
      if (result.error) throw new Error(result.error);
      return successResponse(result.data);
    }

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

  if (config.coachWritable) {
    return withAuth(async (user, supabase) => {
      const body = await request.json();

      const [coachRole, adminRole] = await Promise.all([
        hasCoachRole(supabase, user.id),
        isAdmin(supabase, user.id),
      ]);
      if (!coachRole && !adminRole) return errorResponse('Forbidden', 403);

      if (!adminRole) {
        const {categoryId, notFound} = await resolveCategoryForExisting(config, supabase, id);
        if (notFound) return errorResponse('Not found', 404);
        if (!categoryId) return errorResponse('Could not resolve category', 400);

        const allowed = await hasCategoryAccess(supabase, user.id, categoryId);
        if (!allowed) return errorResponse('Forbidden', 403);

        // If body reassigns to a different category, also check access to the new one
        if (body.category_id && body.category_id !== categoryId) {
          const allowedNew = await hasCategoryAccess(supabase, user.id, body.category_id);
          if (!allowedNew) return errorResponse('Forbidden', 403);
        }
      }

      const result = await config.queryLayer!.update!({supabase: supabaseAdmin}, id, body);
      if (result.error) throw new Error(result.error);
      return successResponse(result.data);
    });
  }

  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();

    if (config.queryLayer?.update) {
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

  if (config.coachWritable) {
    return withAuth(async (user, supabase) => {
      const body = await request.json();

      const [coachRole, adminRole] = await Promise.all([
        hasCoachRole(supabase, user.id),
        isAdmin(supabase, user.id),
      ]);
      if (!coachRole && !adminRole) return errorResponse('Forbidden', 403);

      if (!adminRole) {
        const {categoryId, notFound} = await resolveCategoryForExisting(config, supabase, id);
        if (notFound) return errorResponse('Not found', 404);
        if (!categoryId) return errorResponse('Could not resolve category', 400);

        const allowed = await hasCategoryAccess(supabase, user.id, categoryId);
        if (!allowed) return errorResponse('Forbidden', 403);

        // If body reassigns to a different category, also check access to the new one
        if (body.category_id && body.category_id !== categoryId) {
          const allowedNew = await hasCategoryAccess(supabase, user.id, body.category_id);
          if (!allowedNew) return errorResponse('Forbidden', 403);
        }
      }

      const result = await config.queryLayer!.update!({supabase: supabaseAdmin}, id, body);
      if (result.error) throw new Error(result.error);
      return successResponse(result.data);
    });
  }

  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();

    if (config.queryLayer?.update) {
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

  if (config.coachWritable) {
    return withAuth(async (user, supabase) => {
      const [coachRole, adminRole] = await Promise.all([
        hasCoachRole(supabase, user.id),
        isAdmin(supabase, user.id),
      ]);
      if (!coachRole && !adminRole) return errorResponse('Forbidden', 403);

      if (!adminRole) {
        const {categoryId, notFound} = await resolveCategoryForExisting(config, supabase, id);
        if (notFound) return errorResponse('Not found', 404);
        if (!categoryId) return errorResponse('Could not resolve category', 400);

        const allowed = await hasCategoryAccess(supabase, user.id, categoryId);
        if (!allowed) return errorResponse('Forbidden', 403);
      }

      const result = await config.queryLayer!.delete!({supabase: supabaseAdmin}, id);
      if (result.error) throw new Error(result.error);
      return successResponse({success: true});
    });
  }

  return withAdminAuth(async (user, supabase, admin) => {
    if (config.queryLayer?.delete) {
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
