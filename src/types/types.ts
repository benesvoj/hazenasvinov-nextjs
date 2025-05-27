type CategoryProps = {
	id: string;
	name: string;
	description?: string;
	created_at: string;
	updated_at: string;
	route?: string;
}

type SeasonProps = {
	id: string;
	name: string;
	valid_from: string;
	valid_to: string;
	created_at: string;
	updated_at: string;
}

type SupabaseUser = {
	id: string;
	email: string;
	updated_at: string;
	created_at: string;
}


export type { CategoryProps, SeasonProps, SupabaseUser }