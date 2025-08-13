type CategoryProps = {
	id: string;
	name: string;
	description?: string;
	created_at?: string;
	updated_at?: string;
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
	user_metadata?: {
		full_name?: string;
		phone?: string;
		bio?: string;
		position?: string;
		is_blocked?: boolean;
	};
	email_confirmed_at?: string;
}


type ColumnType = {
	key: string;
	label: React.ReactNode;
	// Add other properties if they exist
};


export type { CategoryProps, SeasonProps, SupabaseUser, ColumnType }