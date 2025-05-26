'use client';

import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {Button} from "@heroui/button";
import {translations} from "@/lib/translations";
import {PlusIcon} from "@heroicons/react/16/solid";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";
import {useFetchUsers} from "@/hooks/useFetchUsers";

export default function Page() {
	const {button} = translations
	const {users, loading, error} = useFetchUsers();
	const {isOpen, onOpen, onOpenChange} = useDisclosure();

	if (loading) return <p>Loading...</p>

	return (
		<div className={"flex flex-col gap-2 border-2 rounded-lg p-4 bg-white/5"}>
			<div className="flex justify-between items-center min-w-max">
				<h1>Seznam uzivatelu do administrace</h1>
				<Button color='primary' size="sm" startContent={<PlusIcon/>} variant={'ghost'}
						onPress={onOpen}>{button.add}</Button>
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