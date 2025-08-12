'use client';

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { PlusIcon } from "@heroicons/react/16/solid";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure } from "@heroui/modal";
import { Input } from "@heroui/input";
import { SupabaseUser } from "@/types/types";
import { translations } from "@/lib/translations";
import { useState } from "react";

interface UsersTabProps {
	users: SupabaseUser[];
	loading: boolean;
}

export const UsersTab: React.FC<UsersTabProps> = ({ users, loading }) => {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const [submitted, setSubmitted] = useState<any>(null);

	const initialFormData = {
		email: '',
		name: ''
	};

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (submitted?.email || submitted?.name) {
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

		setSubmitted(data);
		console.log('submitted data', submitted);
	};

	if (loading) {
		return (
			<Card>
				<CardBody className="text-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Načítání uživatelů...</p>
				</CardBody>
			</Card>
		);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-xl font-semibold">Správa uživatelů</h3>
							<p className="text-sm text-gray-600">{translations.users.description}</p>
						</div>
						<Button 
							color='primary' 
							size="sm" 
							startContent={<PlusIcon/>} 
							variant={'ghost'}
							onPress={onOpen}
						>
							{translations.button.add}
						</Button>
					</div>
				</CardHeader>
				<CardBody>
					<div className="overflow-x-auto">
						<Table aria-label="Users table">
							<TableHeader>
								<TableColumn>{translations.users.table.id}</TableColumn>
								<TableColumn>{translations.users.table.email}</TableColumn>
								<TableColumn>{translations.users.table.createdAt}</TableColumn>
								<TableColumn>{translations.users.table.updatedAt}</TableColumn>
							</TableHeader>
							<TableBody emptyContent={"Žádní uživatelé k zobrazení."}>
								{users.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="font-mono text-sm">{user.id}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell className="text-sm text-gray-600">
											{new Date(user.created_at).toLocaleDateString('cs-CZ')}
										</TableCell>
										<TableCell className="text-sm text-gray-600">
											{new Date(user.updated_at).toLocaleDateString('cs-CZ')}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardBody>
			</Card>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} size='sm'>
				<ModalContent>
					{(onClose) => (
						<form onSubmit={onSubmit} className='flex flex-col gap-4 p-4'>
							<ModalHeader className="flex flex-col gap-1">{translations.users.modal.title}</ModalHeader>
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
								<p className={'text-xs'}>{translations.users.modal.description}</p>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									{translations.button.cancel}
								</Button>
								<Button color="primary" type='submit'>
									{translations.button.confirm}
								</Button>
							</ModalFooter>
						</form>
					)}
				</ModalContent>
			</Modal>
		</>
	);
};
