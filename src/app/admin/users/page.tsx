'use client';

import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import {translations} from "@/lib/translations";
import {PlusIcon} from "@heroicons/react/16/solid";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";
import {useFetchUsers} from "@/hooks/useFetchUsers";
import React, {useState} from "react";

type FormData = {
	email: string;
	name: string;
}

const initialFormData: FormData = {
	email: '',
	name: ''
}

export default function Page() {
	const {table, modal} = translations.users
	const {button} = translations;
	const {users, loading, error} = useFetchUsers();
	const {isOpen, onOpen, onOpenChange} = useDisclosure();


	const [submitted, setSubmitted] = useState<FormData | null>(initialFormData);

	if (loading) return <p>Loading...</p>

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (submitted.email || submitted.name) {
			// Reset the form if it was previously submitted
			setSubmitted(initialFormData);
		}

		const formData = new FormData(e.currentTarget);
		const data = Object.fromEntries(formData);

		console.log(data);

		if (!data.email || !data.name) {
			// Handle validation error
			return;
		}


		setSubmitted(data as FormData);

		console.log('submitted data', submitted)

	};

	return (
		<>
			<div className="flex justify-between items-center min-w-max">
				<h1>{translations.users.title}</h1>
				<Button color='primary' size="sm" startContent={<PlusIcon/>} variant={'ghost'}
						onPress={onOpen}>{button.add}</Button>
			</div>
			<div>
				<Table aria-label="Example static collection table">
					<TableHeader>
						<TableColumn>{table.id}</TableColumn>
						<TableColumn>{table.email}</TableColumn>
						<TableColumn>{table.createdAt}</TableColumn>
						<TableColumn>{table.updatedAt}</TableColumn>
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

			<Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} size='sm'>
				<ModalContent>
					{(onClose) => (
						<form onSubmit={onSubmit} className='flex flex-col gap-4 p-4'>
							<ModalHeader className="flex flex-col gap-1">{modal.title}</ModalHeader>
							<ModalBody>
								<Input
									isRequired
									errorMessage={translations.enterValidEmail}
									label={translations.email}
									labelPlacement="outside"
									name="email"
									placeholder={translations.enterYourEmail}
									type="email"
								/>
								<Input
									isRequired
									label={translations.name}
									labelPlacement="outside"
									name="name"
									placeholder={translations.enterYourName}
									type="text"
								/>
								<p className={'text-xs'}>{modal.description}</p>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{button.cancel}
								</Button>
								<Button color="primary" type='submit'>
									{button.confirm}
								</Button>
							</ModalFooter>
						</form>
					)}
				</ModalContent>
			</Modal>

		</>
	)
}