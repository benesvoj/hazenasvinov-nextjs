import {NextRequest} from 'next/server';

import {successResponse, withAdminAuth, withAuth} from "@/utils/supabase/apiHelpers";

import {CreateSeason} from "@/types";

export async function GET(request: NextRequest) {
	return withAuth(async (user, supabase) => {
		const {data, error} = await supabase
			.from('seasons')
			.select('*')
			.order('start_date', {ascending: false});

		if (error) throw error;

		return successResponse(data);
	})
}

export async function POST(request: NextRequest) {
	return withAdminAuth(async (user, supabase, admin) => {
		const body: CreateSeason = await request.json();
		const {data, error} = await admin
			.from('seasons')
			.insert({...body})
			.select()
			.single();

		if (error) throw error;

		return successResponse(data, 201);
	})
}