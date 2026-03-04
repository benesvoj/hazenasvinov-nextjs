import {NextRequest, NextResponse} from 'next/server';

import {errorResponse, successResponse, withAdminAuth, withAuth} from "@/utils/supabase/apiHelpers";
import {hasCategoryAccess, hasCoachRole, isAdmin} from "@/utils/supabase/coachAuth";

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
	{params}: { params: Promise<{ entity: string; id: string }> }
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
	{params}: { params: Promise<{ entity: string; id: string }> }
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
				// Fetch existing record to get its current category_id
				const {data: existing} = await supabase
					.from(config.tableName)
					.select('category_id')
					.eq('id', id)
					.single();
				if (!existing) return errorResponse('Not found', 404);

				const allowed = await hasCategoryAccess(supabase, user.id, existing.category_id);
				if (!allowed) return errorResponse('Forbidden', 403);

				// If body reassigns to a different category, also check access to the new one
				if (body.category_id && body.category_id !== existing.category_id) {
					const allowedNew = await hasCategoryAccess(supabase, user.id, body.category_id);
					if (!allowedNew) return errorResponse('Forbidden', 403);
				}
			}

			const result = await config.queryLayer!.update!({supabase}, id, body);
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
	{params}: { params: Promise<{ entity: string; id: string }> }
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
				// Fetch existing record to get its current category_id
				const {data: existing} = await supabase
					.from(config.tableName)
					.select('category_id')
					.eq('id', id)
					.single();
				if (!existing) return errorResponse('Not found', 404);

				const allowed = await hasCategoryAccess(supabase, user.id, existing.category_id);
				if (!allowed) return errorResponse('Forbidden', 403);

				// If body reassigns to a different category, also check access to the new one
				if (body.category_id && body.category_id !== existing.category_id) {
					const allowedNew = await hasCategoryAccess(supabase, user.id, body.category_id);
					if (!allowedNew) return errorResponse('Forbidden', 403);
				}
			}

			const result = await config.queryLayer!.update!({supabase}, id, body);
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
	{params}: { params: Promise<{ entity: string; id: string }> }
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
				const {data: existing} = await supabase
					.from(config.tableName)
					.select('category_id')
					.eq('id', id)
					.single();
				if (!existing) return errorResponse('Not found', 404);

				const allowed = await hasCategoryAccess(supabase, user.id, existing.category_id);
				if (!allowed) return errorResponse('Forbidden', 403);
			}

			const result = await config.queryLayer!.delete!({supabase}, id);
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
