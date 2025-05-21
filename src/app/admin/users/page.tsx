'use client';

import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {useEffect, useState} from "react";
import {Api} from "@/app/api/api";

interface SupabaseUser {
	id: string
	email: string
	updated_at: string
	created_at: string
}

export default  function Page() {

	const [users, setUsers] = useState<SupabaseUser[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const res = await fetch(Api.getUsers)
				const data = await res.json()
				setUsers(data)
			} catch (err) {
				console.error('Failed to fetch users', err)
			} finally {
				setLoading(false)
			}
		}

		fetchUsers()
	}, [])

	if (loading) return <p>Loading...</p>

	return(
		<>
		<div>seznam uzivatelu do administrace</div>
		<div>
			<Table aria-label="Example static collection table">
				<TableHeader>
						<TableColumn>id</TableColumn>
						<TableColumn>email</TableColumn>
						<TableColumn>created_at</TableColumn>
						<TableColumn>updated_at</TableColumn>
				</TableHeader>
				<TableBody emptyContent={"No rows to display."}>
					{users.map((user) => (
						<TableRow key={user.id}>
							<TableCell>{user.id}</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>{user.created_at}</TableCell>
							<TableCell>{user.updated_at}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
		</>
	)
}