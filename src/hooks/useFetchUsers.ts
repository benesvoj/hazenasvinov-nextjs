import {useEffect, useState} from "react";
import {Api} from "@/app/api/api";

export interface SupabaseUser {
	id: string;
	email: string;
	updated_at: string;
	created_at: string;
}

export function useFetchUsers() {
	const [users, setUsers] = useState<SupabaseUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await fetch(Api.getUsers);
				const data = await res.json();
				setUsers(data);
			} catch (err) {
				console.error('Failed to fetch users', err);
				setError(err instanceof Error ? err : new Error('Unknown error'));
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, []);

	return { users, loading, error };
}
