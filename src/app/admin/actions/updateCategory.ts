import {createClient} from "@/utils/supabase/client";
import {CategoryProps} from "@/types/types";

const supabase = createClient()

export async function updateCategory({id, name, description, route}: CategoryProps) {
	const {data, error} = await supabase
		.from('categories')
		.update({
			name: name,
			description: description,
			route: route,
			updated_at: new Date()
		})
		.eq('id', id);

	if (error) {
		console.error('Update failed:', error)
		return { success: false, error: error.message }
	}

	return { success: true }
}