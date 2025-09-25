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
import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';
import {PlusCircleIcon} from '@heroicons/react/16/solid';
import {translations} from '@/lib/translations';
import {AddCategoryModal, AddSeasonModal, EditCategoryModal, EditSeasonModal} from './components';
import {DeleteConfirmationModal, AdminContainer} from '@/components';
import {Category, CategorySeason} from '@/types';
import {AgeGroups, Genders} from '@/enums';
import {ageGroupOptions, genderOptions, competitionTypeOptions} from '@/utils';
import {getAgeGroupBadgeColor, getGenderBadgeColor} from './constants';
import {useCategories} from '@/hooks/useCategories';

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

  return (
    <AdminContainer
      actions={
        <Button
          size="sm"
          color="primary"
          startContent={<PlusCircleIcon className="w-4 h-4" />}
          onPress={onAddCategoryOpen}
          aria-label="Přidat novou kategorii"
        >
          Přidat kategorii
        </Button>
      }
    >
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          {loading ? (
            <div className="text-center py-8">{translations.loading}</div>
          ) : (
            <Table aria-label="Categories table">
              <TableHeader>
                <TableColumn>NÁZEV</TableColumn>
                <TableColumn>POPIS</TableColumn>
                <TableColumn>VĚKOVÁ SKUPINA</TableColumn>
                <TableColumn>POHLAVÍ</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>POŘADÍ</TableColumn>
                <TableColumn>AKCE</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Žádné kategorie nebyly nalezeny">
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      {category.age_group ? (
                        <Badge
                          color={getAgeGroupBadgeColor(category.age_group as AgeGroups)}
                          variant="flat"
                          size="sm"
                        >
                          {ageGroupOptions[category.age_group]}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.gender ? (
                        <Badge
                          color={getGenderBadgeColor(category.gender as Genders)}
                          variant="flat"
                          size="sm"
                        >
                          {genderOptions[category.gender]}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={category.is_active ? 'success' : 'default'}
                        variant="flat"
                        size="sm"
                      >
                        {category.is_active ? 'Aktivní' : 'Neaktivní'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{category.sort_order}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

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
        title="Smazat kategorii"
        message={`
          Opravdu chcete smazat kategorii <strong>${selectedCategory?.name}</strong>?<br><br>
          <span class="text-sm text-gray-600">Tato akce je nevratná a může ovlivnit data v celém systému.</span>
        `}
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
