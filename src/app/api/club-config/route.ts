import {NextRequest} from 'next/server';

import {successResponse, withAuth} from "@/utils/supabase/apiHelpers";

export async function GET(request: NextRequest) {
	return withAuth(async (user, supabase) => {
		const {data, error} = await supabase
			.from('club_config')
			.select('*')
			.eq('is_active', true)
			.single();

		if (error) throw error;

		return successResponse(data);
	})
}
