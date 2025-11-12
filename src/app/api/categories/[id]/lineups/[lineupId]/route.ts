/**
 * GET, PATCH, DELETE /api/categories/:id/lineups/:lineupId
 */
import {NextRequest, NextResponse} from "next/server";

import {errorResponse, prepareUpdateData, successResponse, withAdminAuth, withAuth} from "@/utils/supabase/apiHelpers";

import {UpdateCategoryLineup} from "@/types";

export async function GET(request: NextRequest, {params}: { params: Promise<{ id: string, lineupId: string }> }) {
	return withAuth(async (user, supabase) => {
		const {id, lineupId} = await params;
		const {data, error} = await supabase
			.from('category_lineups')
			.select('*')
			.eq('category_id', id)
			.eq('id', lineupId)
			.single();

		if (error) throw error;

		return successResponse(data);
	});
}

export async function PATCH(request: NextRequest, {params}: { params: Promise<{ id: string, lineupId: string }> }) {
	return withAdminAuth(async (user, supabase, admin) => {
		const {id, lineupId} = await params;
		const body: UpdateCategoryLineup = await request.json();
		const updateData = prepareUpdateData(body);

		const {data, error} = await admin
			.from('category_lineups')
			.update(updateData)
			.eq('category_id', id)
			.eq('id', lineupId)
			.select()
			.single();

		if (error) throw error;

		return successResponse(data);
	})
}

export async function DELETE(request: NextRequest, {params}: { params: Promise<{ id: string, lineupId: string }> }) {
	return withAdminAuth(async (user, supabase, admin) => {
		const {id, lineupId} = await params;

		const {data: existing} = await admin
			.from('category_lineups')
			.select('id')
			.eq('category_id', id)
			.eq('id', lineupId)
			.single();

		if (!existing) {
			return errorResponse('Lineup not found', 404);
		}

		const {error} = await admin.from('category_lineups').delete().eq('id', lineupId);

		if (error) throw error;

		return NextResponse.json({success: true, error: null})
	});
}