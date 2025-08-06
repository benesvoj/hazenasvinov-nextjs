import {CategoryProps} from "@/types/types";
import {createClient} from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
	const {name, description, route, updated_at, id}: CategoryProps = await request.json();
	
	const {error} = await supabase
		.from('categories')
		.update({
			name: name,
			description: description || '',
			route: route || '',
			update_at: updated_at,
		})
		.eq('id', id);

	if (error) {
		console.log(error)
		throw new Error('Update failed: ' + error.message);
	}

	return new Response(JSON.stringify({ success: true }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
}
