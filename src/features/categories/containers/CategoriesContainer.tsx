'use client';

import React, {useState} from 'react';

import {useQuery} from '@tanstack/react-query';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {PlusIcon} from "@/lib/icons";
import {translations} from '@/lib/translations';

import {Dialog, Search} from '@/components';
import {ModalMode} from '@/enums';
import {useCategories, useCategoryFiltering, useCategoryForm} from '@/hooks';
import {fetchCategories} from '@/queries/categories/queries';
import {AppPageLayout, FloatingActions} from "@/shared/components";
import {Category} from '@/types';

import {CategoriesTable} from "../components/CategoriesTable";
import CategoryFeesTab from '../components/CategoryFeesTab';
import CategoryModal from '../components/CategoryModal';
import {Button} from "@heroui/react";

export function CategoriesContainer() {

	const t = translations.categories;

	const {
		data = [],
		isLoading: loading,
		refetch,
	} = useQuery({
		queryKey: ['categories'],
		queryFn: fetchCategories,
	});

	const [activeTab, setActiveTab] = useState<'categories' | 'membershipFees'>('categories');

	const [searchTerm, setSearchTerm] = useState('');
	const {filteredData: categories} = useCategoryFiltering(data, {searchTerm});
	const {loading: crudLoading, createCategory, updateCategory, deleteCategory} = useCategories();

	const {
		formData,
		setFormData,
		selectedItem: selectedCategory,
		modalMode,
		openAddMode,
		openEditMode,
		validateForm,
		resetForm,
	} = useCategoryForm();

	// Modal states
	const modal = useModal();
	const deleteModal = useModalWithItem<Category>();

	const handleAddCategory = () => {
		openAddMode();
		modal.onOpen();
	};

	const handleEdit = async (category: Category) => {
		openEditMode(category);
		modal.onOpen();
	};

	// Enhanced handlers that include modal management
	const handleSubmit = async () => {
		const {valid, errors} = validateForm();

		if (!valid) {
			console.error('Validation errors', errors);
			return;
		}

		try {
			if (modalMode === ModalMode.EDIT && selectedCategory) {
				await updateCategory(selectedCategory.id, formData);
			} else {
				await createCategory(formData);
			}
			await refetch();
			modal.onClose();
			resetForm();
		} catch (error) {
			console.error(error);
		}
	};

	const handleDelete = async (category: Category) => {
		deleteModal.openWith(category);
	};

	const handleConfirmDelete = async () => {
		if (!deleteModal.selectedItem) return;

		const success = await deleteCategory(deleteModal.selectedItem.id);

		if (success) {
			await refetch();
			deleteModal.closeAndClear();
		}
	};

	const filters = (
		<div className="w-full max-w-md">
			<Search
				value={searchTerm}
				onChange={setSearchTerm}
				placeholder={translations.categories.placeholders.searchCategory}
				size="sm"
			/>
		</div>
	);

	return (
		<>
			<AppPageLayout
				activeTab={activeTab}
				onTabChange={setActiveTab}

				tabs={[{
					key: 'categories',
					title: translations.categories.page.title,
					filters: filters,
					content: <CategoriesTable
						data={categories}
						onEdit={handleEdit}
						onDelete={handleDelete}
						isLoading={loading}
					/>,
					floatingActions: <FloatingActions
					actions={[{
						label: translations.categories.actions.add,
						onClick: handleAddCategory,
						icon: <PlusIcon className={'h-4 w-4'}/>,
					}]}
				/>
				}, {
					key: 'membershipFees',
					title: t.modal.membershipFeesTab,
					content: <CategoryFeesTab/>
					floatingActions: <FloatingActions actions={[{
							icon: {<PlusIcon className="w-5 h-5" />}
							onClick: {() => {
								setSelectedFee(null);
								modal.onOpen();
							}}
							label: Přidat poplatek
					}]}>
				}]}
			/>

			<CategoryModal
				isOpen={modal.isOpen}
				onClose={modal.onClose}
				onSubmit={handleSubmit}
				formData={formData}
				setFormData={setFormData}
				mode={modalMode}
				isLoading={crudLoading}
			/>

			<Dialog
				isOpen={deleteModal.isOpen}
				onClose={deleteModal.closeAndClear}
				title={translations.categories.modal.delete.title}
				onSubmit={handleConfirmDelete}
				submitButtonLabel={translations.common.actions.delete}
				isLoading={crudLoading}
				dangerAction
				size={'sm'}
			>
				{translations.categories.modal.delete.message}
			</Dialog>
		</>
	);
}
