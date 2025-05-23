'use client';

import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {useEffect, useState} from "react";
import {Api} from "@/app/api/api";
import {Button, ButtonGroup} from "@heroui/button";
import {translations} from "@/lib/translations";
import {PlusIcon} from "@heroicons/react/16/solid";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";

interface SupabaseUser {
	id: string
	email: string
	updated_at: string
	created_at: string
}

export default function Page() {

	const {button} = translations

	const [users, setUsers] = useState<SupabaseUser[]>([])
	const [loading, setLoading] = useState(true)

	const {isOpen, onOpen, onOpenChange} = useDisclosure();

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

	return (
		<div className={"flex flex-col gap-2 border-2 rounded-lg p-4 bg-white/5"}>
			<div className="flex justify-between items-center min-w-max">
				<h1>Seznam uzivatelu do administrace</h1>
				<Button color='primary' size="sm" startContent={<PlusIcon />} variant={'ghost'} onPress={onOpen}>{button.add}</Button>
			</div>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader>
							<ModalBody>
								<p>
									Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non
									risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor
									quam.
								</p>
								<p>
									Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non
									risus hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor
									quam.
								</p>
								<p>
									Magna exercitation reprehenderit magna aute tempor cupidatat consequat elit dolor
									adipisicing. Mollit dolor eiusmod sunt ex incididunt cillum quis. Velit duis sit
									officia eiusmod Lorem aliqua enim laboris do dolor eiusmod. Et mollit incididunt
									nisi consectetur esse laborum eiusmod pariatur proident Lorem eiusmod et. Culpa
									deserunt nostrud ad veniam.
								</p>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									Close
								</Button>
								<Button color="primary" onPress={onClose}>
									Action
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

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
		</div>
	)
}