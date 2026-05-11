'use client';

import React, {useState} from 'react';

import {useQuery} from '@tanstack/react-query';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {PlusIcon} from '@/lib/icons';
import {translations} from '@/lib/translations';

import {Dialog, Search} from '@/components';
import {ModalMode} from '@/enums';
import {
  useCategories,
  useCategoryFiltering,
  useCategoryForm,
  useCategoryMembershipFees,
} from '@/hooks';
import {fetchCategories} from '@/queries/categories/queries';
import {AppPageLayout, FloatingActions} from '@/shared/components';
import {commonCopy} from '@/shared/copy';
import {Category, CategoryMembershipFee} from '@/types';

import {CategoriesTable} from '../components/CategoriesTable';
import CategoryFeeFormModal from '../components/CategoryFeeFormModal';
import CategoryFeesTab from '../components/CategoryFeesTab';
import CategoryModal from '../components/CategoryModal';

export function CategoriesContainer() {
  const t = translations.categories;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

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
  const [selectedFee, setSelectedFee] = useState<CategoryMembershipFee | null>(null);

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

  const {deleteFee} = useCategoryMembershipFees(selectedYear);

  // Modal states
  const modal = useModal();
  const deleteModal = useModalWithItem<Category>();
  const feeModal = useModal();
  const deleteFeeModal = useModalWithItem<CategoryMembershipFee>();

  const handleAddCategory = () => {
    openAddMode();
    modal.onOpen();
  };

  const handleEdit = async (category: Category) => {
    openEditMode(category);
    modal.onOpen();
  };

  const handleAddFee = () => {
    setSelectedFee(null);
    feeModal.onOpen();
  };

  const handleEditFee = (fee: CategoryMembershipFee) => {
    setSelectedFee(fee);
    feeModal.onOpen();
  };

  const handleDeleteFee = async () => {
    if (selectedFee) {
      await deleteFee(selectedFee.id);
      deleteModal.onClose();
    }
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
        tabs={[
          {
            key: 'categories',
            title: translations.categories.page.title,
            filters: filters,
            content: (
              <CategoriesTable
                data={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={loading}
              />
            ),
            floatingActions: (
              <FloatingActions
                actions={[
                  {
                    label: translations.categories.actions.add,
                    onClick: handleAddCategory,
                    icon: <PlusIcon className={'h-4 w-4'} />,
                  },
                ]}
              />
            ),
          },
          {
            key: 'membershipFees',
            title: t.modal.membershipFeesTab,
            content: (
              <CategoryFeesTab
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                onEdit={handleEditFee}
                onDelete={handleDeleteFee}
              />
            ),
            floatingActions: (
              <FloatingActions
                actions={[
                  {
                    label: 'Přidat poplatek',
                    icon: <PlusIcon className="w-5 h-5" />,
                    onClick: handleAddFee,
                  },
                ]}
              />
            ),
          },
        ]}
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

      <CategoryFeeFormModal
        isOpen={feeModal.isOpen}
        onClose={feeModal.onClose}
        fee={selectedFee}
        categories={categories || []}
        defaultYear={selectedYear}
      />

      <Dialog
        isOpen={deleteFeeModal.isOpen}
        onClose={deleteFeeModal.onClose}
        onSubmit={handleDeleteFee}
        title="Smazat členský poplatek"
        dangerAction
        submitButtonLabel={commonCopy.actions.delete}
      >
        Opravdu chcete smazat tento členský poplatek?
      </Dialog>
    </>
  );
}
