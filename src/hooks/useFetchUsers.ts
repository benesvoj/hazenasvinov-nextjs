import {useEffect, useState} from "react";
import {Api} from "@/app/api/api";
import {SupabaseUser} from "@/types/types";

export interface LoginLog {
	id: string;
	user_id: string;
	email: string;
	login_time: string;
	action: string;
	user_agent: string;
	status: string;
}

export function useFetchUsers(includeLogs: boolean = false) {
	const [users, setUsers] = useState<SupabaseUser[]>([]);
	const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const url = includeLogs ? `${Api.getUsers}?includeLogs=true` : Api.getUsers;
				const res = await fetch(url);
				const data = await res.json();
				
				if (includeLogs && data.users && data.loginLogs) {
					setUsers(data.users);
					setLoginLogs(data.loginLogs);
				} else {
					setUsers(data);
					setLoginLogs([]);
				}
			} catch (err) {
				console.error('Failed to fetch users', err);
				setError(err instanceof Error ? err : new Error('Unknown error'));
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, [includeLogs]);

	return {users, loginLogs, loading, error};
}
