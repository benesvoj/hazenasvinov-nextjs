'use client';

import React, {useEffect} from 'react';

import {
  useDisclosure,
  Badge,
  Button,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';

import {PlusCircleIcon} from '@heroicons/react/16/solid';
import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {DeleteConfirmationModal, AdminContainer, UnifiedTable} from '@/components';
import {AgeGroups, ButtonTypes, Genders} from '@/enums';
import {useCategories} from '@/hooks';
import {Category, CategorySeason} from '@/types';
import {ageGroupsOptions, genderOptions, competitionTypeOptions} from '@/utils';

import {AddCategoryModal, AddSeasonModal, EditCategoryModal, EditSeasonModal} from './components';
import {getAgeGroupBadgeColor, getGenderBadgeColor} from './constants';

export default function CategoriesAdminPage() {
  // Use the custom hook for all business logic
  const {
    categories,
    seasons,
    categorySeasons,
    selectedCategory,
    selectedSeason,
    loading,
    error,
    formData,
    seasonFormData,
    editSeasonFormData,
    fetchCategories,
    fetchSeasons,
    fetchCategorySeasons,
    handleAddCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleAddSeason,
    handleUpdateSeason,
    handleRemoveSeason,
    handleEditSeason,
    openEditModal,
    openDeleteModal,
    setFormData,
    setSeasonFormData,
    setEditSeasonFormData,
    setSelectedCategory,
    setSelectedSeason,
    setError,
    resetFormData,
    resetSeasonFormData,
    resetEditSeasonFormData,
  } = useCategories();

  // Modal states
  const {
    isOpen: isAddCategoryOpen,
    onOpen: onAddCategoryOpen,
    onClose: onAddCategoryClose,
  } = useDisclosure();
  const {
    isOpen: isEditCategoryOpen,
    onOpen: onEditCategoryOpen,
    onClose: onEditCategoryClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteCategoryOpen,
    onOpen: onDeleteCategoryOpen,
    onClose: onDeleteCategoryClose,
  } = useDisclosure();
  const {
    isOpen: isAddSeasonOpen,
    onOpen: onAddSeasonOpen,
    onClose: onAddSeasonClose,
  } = useDisclosure();
  const {
    isOpen: isEditSeasonOpen,
    onOpen: onEditSeasonOpen,
    onClose: onEditSeasonClose,
  } = useDisclosure();

  // Initialize data on component mount
  useEffect(() => {
    fetchSeasons();
    fetchCategories();
  }, [fetchSeasons, fetchCategories]);

  // Enhanced handlers that include modal management
  const handleAddCategoryWithModal = async () => {
    await handleAddCategory();
    onAddCategoryClose();
    resetFormData();
  };

  const handleUpdateCategoryWithModal = async () => {
    await handleUpdateCategory();
    onEditCategoryClose();
    setSelectedCategory(null);
    resetFormData();
  };

  const handleDeleteCategoryWithModal = async () => {
    await handleDeleteCategory();
    onDeleteCategoryClose();
    setSelectedCategory(null);
  };

  const handleAddSeasonWithModal = async () => {
    await handleAddSeason();
    onAddSeasonClose();
    resetSeasonFormData();
  };

  const handleUpdateSeasonWithModal = async () => {
    await handleUpdateSeason();
    onEditSeasonClose();
    setSelectedSeason(null);
    resetEditSeasonFormData();
  };

  const openEditModalWithModal = (category: Category) => {
    openEditModal(category);
    onEditCategoryOpen();
  };

  const openDeleteModalWithModal = (category: Category) => {
    openDeleteModal(category);
    onDeleteCategoryOpen();
  };

  const handleEditSeasonWithModal = (categorySeason: CategorySeason) => {
    handleEditSeason(categorySeason);
    onEditSeasonOpen();
  };

  const t = translations.categories;

  const categoryColumns = [
    {key: 'name', label: t.table.name},
    {key: 'description', label: t.table.description},
    {key: 'age_group', label: t.table.ageGroup},
    {key: 'gender', label: t.table.gender},
    {key: 'is_active', label: t.table.status},
    {key: 'sort_order', label: t.table.sortOrder},
    {key: 'actions', label: t.table.actions},
  ];

  const renderCategoryCell = (category: Category, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <span className="font-medium">{category.name}</span>;
      case 'description':
        return <span className="font-medium">{category.description || '-'}</span>;
      case 'age_group':
        return (
          <span className="font-medium">{ageGroupsOptions[category.age_group as AgeGroups]}</span>
        );
      case 'gender':
        return <span className="font-medium">{genderOptions[category.gender as Genders]}</span>;
      case 'is_active':
        return (
          <span className="font-medium">
            {category.is_active ? t.table.activeLabel : t.table.inactiveLabel}
          </span>
        );
      case 'sort_order':
        return <span className="font-medium">{category.sort_order}</span>;
      case 'actions':
        return (
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="light"
              color="primary"
              isIconOnly
              onPress={() => openEditModalWithModal(category)}
              aria-label={`Upravit kategorii ${category.name}`}
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="light"
              color="danger"
              isIconOnly
              onPress={() => openDeleteModalWithModal(category)}
              aria-label={`Smazat kategorii ${category.name}`}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        );
    }
  };

  return (
    <AdminContainer
      actions={[
        {
          label: t.addCategory,
          onClick: onAddCategoryOpen,
          variant: 'solid',
          buttonType: ButtonTypes.CREATE,
        },
      ]}
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <UnifiedTable
        columns={categoryColumns}
        data={categories}
        ariaLabel={t.title}
        renderCell={renderCategoryCell}
        getKey={(category: Category) => category.id}
        emptyContent={t.table.noCategories}
        isStriped
      />

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={onAddCategoryClose}
        onAddCategory={handleAddCategoryWithModal}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={isEditCategoryOpen}
        onClose={onEditCategoryClose}
        onUpdateCategory={handleUpdateCategoryWithModal}
        onAddSeason={onAddSeasonOpen}
        onEditSeason={handleEditSeasonWithModal}
        onRemoveSeason={handleRemoveSeason}
        formData={formData}
        setFormData={setFormData}
        categorySeasons={categorySeasons}
      />

      {/* Delete Category Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteCategoryOpen}
        onClose={onDeleteCategoryClose}
        onConfirm={handleDeleteCategoryWithModal}
        title={t.deleteCategory}
        message={t.deleteCategoryMessage}
      />

      {/* Add Season Modal */}
      <AddSeasonModal
        isOpen={isAddSeasonOpen}
        onClose={onAddSeasonClose}
        onAddSeason={handleAddSeasonWithModal}
        seasonFormData={seasonFormData}
        setSeasonFormData={setSeasonFormData}
        seasons={seasons}
        competitionTypes={competitionTypeOptions}
      />

      {/* Edit Season Modal */}
      <EditSeasonModal
        isOpen={isEditSeasonOpen}
        onClose={onEditSeasonClose}
        onUpdateSeason={handleUpdateSeasonWithModal}
        selectedSeason={selectedSeason}
        editSeasonFormData={editSeasonFormData}
        setEditSeasonFormData={setEditSeasonFormData}
        competitionTypes={competitionTypeOptions}
      />
    </AdminContainer>
  );
}
