import {translations} from "@/lib/translations";
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {useFetchCategories} from "@/hooks/useFetchCategories";
import {Skeleton} from "@heroui/skeleton";
import {EditIcon} from "@/lib/icons";
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure} from "@heroui/modal";
import React from "react";

type ActionsCellProps = {}

//TODO: fix issue with React.memo and useDisclosure
const ActionsCell: React.FC<ActionsCellProps> = React.memo(() => {
	const {isOpen, onOpen, onOpenChange} = useDisclosure();

	const handleOpenModal = () => {
		onOpenChange(true);
	}

	return (
		<div className="relative flex items-center gap-2">
			<span className="text-lg text-default-400 cursor-pointer active:opacity-50">
				<EditIcon onClick={handleOpenModal} />
			</span>
			<Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} size='sm'>
				<ModalContent>
					<ModalHeader>{translations.categories.edit}</ModalHeader>
					<ModalBody>
						<p>{translations.categories.editDescription}</p>
					</ModalBody>
					<ModalFooter>
						<button className="btn btn-primary">{translations.button.save}</button>
						<button className="btn btn-secondary">{translations.button.cancel}</button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</div>
	)
})

export const CategoriesTable = () => {


	const {data, loading, error} = useFetchCategories();

	if (loading) {
		return <Skeleton/>;
	}

	if (error) {
		return <div className="text-red-500">{translations.error.fetchCategories}</div>;
	}

	return (
		<Table aria-label={translations.categories.title}>
			<TableHeader>
				<TableColumn>Id</TableColumn>
				<TableColumn>Name</TableColumn>
				<TableColumn>Description</TableColumn>
				<TableColumn>Route</TableColumn>
				<TableColumn>Updated At</TableColumn>
				<TableColumn>Created At</TableColumn>
				<TableColumn>Actions</TableColumn>
			</TableHeader>
			<TableBody items={data}>
				{(item) => (
					<TableRow key={item.id}>
						<TableCell>{item.id}</TableCell>
						<TableCell>{item.name}</TableCell>
						<TableCell>{item.description}</TableCell>
						<TableCell>{item.route}</TableCell>
						<TableCell>{new Date(item.updated_at).toLocaleDateString()}</TableCell>
						<TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
						<TableCell>
							<ActionsCell />
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}