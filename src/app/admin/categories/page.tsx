'use client';

import React, {useState} from 'react';

import {Input, Tab, Tabs, useDisclosure} from '@heroui/react';

import {getAgeGroupLabel, getGenderLabel, getStatusClasses, getStatusLabel} from '@/helpers/ui';

import CategoryFeesTab from '@/app/admin/categories/components/CategoryFeesTab';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useCategories, useCategoryFiltering, useCategoryForm, useFetchCategories} from '@/hooks';
import {translations} from '@/lib';
import {Category} from '@/types';

import CategoryModal from './components/CategoryModal';

export default function CategoriesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const {data: fetchCategories, loading, refetch} = useFetchCategories();
  const {filteredData: categories} = useCategoryFiltering(fetchCategories, {searchTerm});
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
  const t = translations.categories;
  const tAction = translations.action;

  // Modal states
  const {
    isOpen: isCategoryModalOpen,
    onOpen: onCategoryModalOpen,
    onClose: onCategoryModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteCategoryOpen,
    onOpen: onDeleteCategoryOpen,
    onClose: onDeleteCategoryClose,
  } = useDisclosure();

  const handleAddCategory = () => {
    openAddMode();
    onCategoryModalOpen();
  };

  const handleEdit = async (category: Category) => {
    openEditMode(category);
    onCategoryModalOpen();
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
      onCategoryModalClose();
      resetForm();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (category: Category) => {
    openEditMode(category);
    onDeleteCategoryOpen();
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      await deleteCategory(selectedCategory.id);
      await refetch();
      onDeleteCategoryClose();
      resetForm();
    }
  };

  const categoryColumns = [
    {key: 'name', label: t.table.name},
    {key: 'description', label: t.table.description},
    {key: 'age_group', label: t.table.ageGroup},
    {key: 'gender', label: t.table.gender},
    {key: 'is_active', label: t.table.status},
    {key: 'sort_order', label: t.table.sortOrder},
    {
      key: 'actions',
      label: t.table.actions,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.UPDATE, onPress: handleEdit, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: handleDelete, title: tAction.delete},
      ],
    },
  ];

  const renderCategoryCell = (category: Category, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <span className="font-medium">{category.name}</span>;
      case 'description':
        return <span className="font-medium">{category.description || '-'}</span>;
      case 'age_group':
        return <span className="font-medium">{getAgeGroupLabel(category.age_group)}</span>;
      case 'gender':
        return <span className="font-medium">{getGenderLabel(category.gender)}</span>;
      case 'is_active':
        return (
          <span className={`font-medium ${getStatusClasses(category.is_active ?? false)}`}>
            {getStatusLabel(category.is_active ?? false)}
          </span>
        );
      case 'sort_order':
        return <span className="font-medium">{category.sort_order}</span>;
    }
  };

  const filters = () => {
    return (
      <div className="w-full max-w-md">
        <Input
          label={t.searchCategory}
          placeholder={t.searchCategoryPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="sm"
        />
      </div>
    );
  };

  return (
    <>
      <AdminContainer
        loading={loading}
        filters={filters()}
        actions={[
          {
            label: t.addCategory,
            onClick: handleAddCategory,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
      >
        <Tabs aria-label="Categories admin tabs">
          <Tab key="categories" title={t.title}>
            <UnifiedTable
              columns={categoryColumns}
              data={categories}
              ariaLabel={t.title}
              renderCell={renderCategoryCell}
              getKey={(category: Category) => category.id}
              emptyContent={t.table.noCategories}
              isStriped
            />
          </Tab>
          <Tab key="membershipFees" title={t.modal.membershipFeesTab}>
            <CategoryFeesTab />
          </Tab>
        </Tabs>
      </AdminContainer>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={onCategoryModalClose}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        mode={modalMode}
        selectedCategory={selectedCategory}
        isLoading={crudLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteCategoryOpen}
        onClose={onDeleteCategoryClose}
        onConfirm={handleConfirmDelete}
        title={t.deleteCategory}
        message={t.deleteCategoryMessage}
        isLoading={crudLoading}
      />
    </>
  );
}
