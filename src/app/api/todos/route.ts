import {NextRequest} from "next/server";

import {successResponse, withAdminAuth, withAuth} from "@/utils/supabase/apiHelpers"

import {TodoInsert} from "@/types";

export async function GET(request: NextRequest) {
	return withAuth(async (user, supabase) => {
		const {data, error} = await supabase
			.from('todos')
			.select('*');

		if (error) throw error;

		return successResponse(data);
	})
}

export async function POST(request: NextRequest) {
	return withAdminAuth(async(user, supabase, admin) => {
		const body: TodoInsert = await request.json();
		const {data, error} = await admin
			.from('todos')
			.insert({...body})
			.select()
			.single();

		if (error) throw error;

		return successResponse(data, 201);
	})
}