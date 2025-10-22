'use client';

import React, {useEffect, useState} from 'react';

import {Input, Tab, Tabs, useDisclosure} from '@heroui/react';

import {getAgeGroupLabel, getGenderLabel, getStatusClasses, getStatusLabel} from '@/helpers/ui';

import CategoryFeesTab from '@/app/admin/categories/components/CategoryFeesTab';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useCategories, useFetchCategories} from '@/hooks';
import {translations} from '@/lib';
import {Category} from '@/types';

import CategoryModal from './components/CategoryModal';

export default function CategoriesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);
  const [formData, setFormData] = useState<Category>({
    id: '',
    name: '',
    description: '',
    age_group: undefined,
    gender: undefined,
    is_active: true,
    sort_order: 0,
  });

  // Use the custom hook for all business logic
  const {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
    clearError,
  } = useCategories({
    searchTerm,
  });

  const {data, loading: categoriesLoading, error: categoriesError} = useFetchCategories();

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

  // Initialize data on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Enhanced handlers that include modal management
  const handleCategorySubmit = async () => {
    if (modalMode === ModalMode.ADD) {
      const result = await createCategory({
        name: formData.name,
        description: formData.description,
        age_group: formData.age_group,
        gender: formData.gender,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      });

      if (result.success) {
        onCategoryModalClose();
        resetFormData();
        clearError();
      }
    } else {
      if (!selectedCategory) return;

      const result = await updateCategory({
        id: selectedCategory.id,
        name: formData.name,
        description: formData.description,
        age_group: formData.age_group,
        gender: formData.gender,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      });

      if (result.success) {
        onCategoryModalClose();
        setSelectedCategory(null);
        resetFormData();
        clearError();
      }
    }
  };

  const resetFormData = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      age_group: undefined,
      gender: undefined,
      is_active: true,
      sort_order: 0,
    });
  };

  const handleDeleteCategoryWithModal = async () => {
    if (!selectedCategory) return;

    const result = await deleteCategory(selectedCategory.id);

    if (result.success) {
      onDeleteCategoryClose();
      setSelectedCategory(null);
      clearError();
    }
  };

  const openCreateModal = () => {
    setModalMode(ModalMode.ADD);
    resetFormData();
    onCategoryModalOpen();
  };

  const openEditModal = (category: Category) => {
    setModalMode(ModalMode.EDIT);
    setSelectedCategory(category);
    setFormData(category);
    onCategoryModalOpen();
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    onDeleteCategoryOpen();
  };

  const t = translations.categories;
  const tAction = translations.action;

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
        {type: ActionTypes.UPDATE, onPress: openEditModal, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: openDeleteModal, title: tAction.delete},
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
          <span className={`font-medium ${getStatusClasses(category.is_active)}`}>
            {getStatusLabel(category.is_active)}
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
    <AdminContainer
      loading={loading}
      filters={filters()}
      actions={[
        {
          label: t.addCategory,
          onClick: openCreateModal,
          variant: 'solid',
          buttonType: ActionTypes.CREATE,
        },
      ]}
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <Tabs aria-label="Categories admin tabs">
        <Tab key="categories" title={t.title}>
          <UnifiedTable
            columns={categoryColumns}
            data={data}
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

      {/* Category Modal (Create/Edit) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={onCategoryModalClose}
        onSubmit={handleCategorySubmit}
        formData={formData}
        setFormData={setFormData}
        mode={modalMode}
      />

      {/* Delete Category Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteCategoryOpen}
        onClose={onDeleteCategoryClose}
        onConfirm={handleDeleteCategoryWithModal}
        title={t.deleteCategory}
        message={t.deleteCategoryMessage}
      />
    </AdminContainer>
  );
}
