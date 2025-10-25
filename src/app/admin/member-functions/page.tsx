'use client';

import React from 'react';

import {useDisclosure} from '@heroui/react';

import {AdminContainer, DeleteConfirmationModal, showToast, UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType, ModalMode} from '@/enums';
import {useFetchMemberFunctions, useMemberFunctionForm, useMemberFunctions} from '@/hooks';
import {translations} from '@/lib';
import {MemberFunction} from '@/types';

import FunctionFormModal from './components/FunctionFormModal';

const tAction = translations.action;
const tCommon = translations.common;
const tMemberFunctions = translations.memberFunctions;

export default function MemberFunctionsAdminPage() {
	const {data: functionsData, loading: functionsLoading, refetch} = useFetchMemberFunctions();
	const {
		loading: crudLoading,
		createMemberFunction,
		updateMemberFunction,
		deleteMemberFunction,
	} = useMemberFunctions();
	const {
		openAddMode,
		openEditMode,
		modalMode,
		formData,
		selectedRecord: selectedFunction,
		setFormData,
		validateForm,
		resetForm,
	} = useMemberFunctionForm();

	// Modal states
	const {
		isOpen: isFunctionModalOpen,
		onOpen: onFunctionModalOpen,
		onClose: onFunctionModalClose,
	} = useDisclosure();
	const {
		isOpen: isDeleteFunctionOpen,
		onOpen: onDeleteFunctionOpen,
		onClose: onDeleteFunctionClose,
	} = useDisclosure();

	const handleAdd = () => {
		openAddMode();
		onFunctionModalOpen();
	};

	const handleEdit = (item: MemberFunction) => {
		openEditMode(item);
		onFunctionModalOpen();
	};

	const handleDelete = (item: MemberFunction) => {
		openEditMode(item);
		onDeleteFunctionOpen();
	};

	const handleConfirmDelete = async () => {
		try {
			if (selectedFunction) {
				await deleteMemberFunction(selectedFunction.id);
				await refetch();
				onDeleteFunctionClose();
				resetForm();
			}
		} catch (error) {
			console.error(error);
			showToast.danger(tCommon.responseMessage.unknownError)
		}
	};

	const handleSubmit = async () => {
		const {valid, errors} = validateForm();

		if (!valid) {
			console.error('Validation error ', errors);
			return;
		}

		try {
			if (modalMode === ModalMode.EDIT && selectedFunction) {
				await updateMemberFunction(selectedFunction.id, formData);
			} else {
				await createMemberFunction(formData);
			}
			await refetch();
			onFunctionModalClose();
			resetForm();
		} catch (error) {
			console.error(error);
			showToast.danger(tCommon.responseMessage.unknownError)
		}
	};

	const functionColumns = [
		{key: 'name', label: tMemberFunctions.table.header.name},
		{key: 'display_name', label: tMemberFunctions.table.header.displayName},
		{key: 'description', label: tMemberFunctions.table.header.description},
		{key: 'sort_order', label: tMemberFunctions.table.header.sorting},
		{key: 'is_active', label: tMemberFunctions.table.header.status},
		{
			key: 'actions',
			label: tMemberFunctions.table.header.actions,
			align: ColumnAlignType.CENTER,
			isActionColumn: true,
			actions: [
				{type: ActionTypes.UPDATE, onPress: handleEdit, title: tAction.edit},
				{type: ActionTypes.DELETE, onPress: handleDelete, title: tAction.delete},
			],
		},
	];

	const renderFunctionCell = (functionItem: MemberFunction, columnKey: string) => {
		switch (columnKey) {
			case 'name':
				return <span className="font-medium">{functionItem.name}</span>;
			case 'display_name':
				return <span className="font-medium">{functionItem.display_name}</span>;
			case 'description':
				return <span className="font-medium">{functionItem.description || '-'}</span>;
			case 'sort_order':
				return <span className="font-medium">{functionItem.sort_order}</span>;
			case 'is_active':
				return (
					<span className="font-medium">{functionItem.is_active ? tMemberFunctions.status.active : tMemberFunctions.status.inactive}</span>
				);
		}
		return null;
	};

	return (
		<>
			<AdminContainer
				loading={functionsLoading}
				actions={[
					{
						label: tAction.add,
						onClick: handleAdd,
						variant: 'solid',
						buttonType: ActionTypes.CREATE,
					},
				]}
			>
				<UnifiedTable
					isLoading={functionsLoading}
					columns={functionColumns}
					data={functionsData}
					ariaLabel={translations.memberFunctions.table.ariaLabel}
					renderCell={renderFunctionCell}
					getKey={(functionItem: MemberFunction) => functionItem.id}
					emptyContent={translations.table.emptyContent}
					isStriped
				/>
			</AdminContainer>

			<FunctionFormModal
				isOpen={isFunctionModalOpen}
				onClose={onFunctionModalClose}
				onSubmit={handleSubmit}
				formData={formData}
				setFormData={setFormData}
				mode={modalMode}
				loading={crudLoading}
			/>

			{/* Delete Confirmation Modal */}
			<DeleteConfirmationModal
				isOpen={isDeleteFunctionOpen}
				onClose={onDeleteFunctionClose}
				onConfirm={handleConfirmDelete}
				isLoading={crudLoading}
				title={tMemberFunctions.modal.deleteTitle}
				message={`${tMemberFunctions.modal.deleteDescription} ${selectedFunction?.display_name}?`}
			/>
		</>
	);
}
