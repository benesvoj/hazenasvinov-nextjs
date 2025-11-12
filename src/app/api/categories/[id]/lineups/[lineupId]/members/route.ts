/**
 * GET, POST /api/categories/:id/lineups/:lineupId/members
 */

import {NextRequest} from "next/server";

import {successResponse, withAdminAuth, withAuth} from "@/utils/supabase/apiHelpers";

export async  function GET(request: NextRequest, {params}: {params: Promise<{id: string, lineupId: string}>}) {
	return withAuth(async (user, supabase) => {
		const {id, lineupId} = await params;

		// First verify that the lineup belongs to this category
		const {data: lineup, error: lineupError} = await supabase
			.from('category_lineups')
			.select('id, category_id')
			.eq('id', lineupId)
			.eq('category_id', id)
			.single();

		if (lineupError || !lineup) {
			throw new Error('Lineup not found or does not belong to this category');
		}

		// Fetch lineup members with member details
		const {data, error} = await supabase
			.from('category_lineup_members')
			.select(`
				*,
				members!inner (
					id,
					name,
					surname,
					registration_number,
					category_id
				)
			`)
			.eq('lineup_id', lineupId)
			.eq('is_active', true)
			.order('jersey_number', {ascending: true});

		if (error) throw error;

		return successResponse(data);
	});
}

export async function POST(request: NextRequest, {params}: {params: Promise<{id: string, lineupId: string}>}) {
	return withAdminAuth(async (user, supabase, admin) => {
		const {id, lineupId} = await params;
		const body = await request.json();

		if (!body.member_id) {
			throw new Error('member_id is required');
		}
		if (!body.position) {
			throw new Error('position is required');
		}

		// First verify that the lineup belongs to this category
		const {data: lineup, error: lineupError} = await supabase
			.from('category_lineups')
			.select('id, category_id')
			.eq('id', lineupId)
			.eq('category_id', id)
			.single();

		if (lineupError || !lineup) {
			throw new Error('Lineup not found or does not belong to this category');
		}

		const {data, error} = await admin
			.from('category_lineup_members')
			.insert({
				lineup_id: lineupId,
				member_id: body.member_id,
				position: body.position,
				jersey_number: body.jersey_number,
				is_captain: body.is_captain || false,
				is_vice_captain: body.is_vice_captain || false,
				is_active: true,
				added_by: user.id,
			})
			.select()
			.single();

		if (error) throw error;

		return successResponse(data, 201);
	})
}