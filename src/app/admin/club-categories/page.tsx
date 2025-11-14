'use client';

import React, {useState} from 'react';

import {Input} from '@heroui/input';
import {useDisclosure} from '@heroui/modal';
import {Select, SelectItem} from '@heroui/react';

import {translations} from '@/lib/translations';

import {AdminContainer, DeleteConfirmationModal, showToast, UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType, ModalMode} from '@/enums';
import {
  useClubCategories,
  useClubCategoryFiltering,
  useClubCategoryForm,
  useFetchCategories,
  useFetchClubCategories,
  useFetchClubs,
  useFetchSeasons,
} from '@/hooks';
import {ClubCategorySchema, ClubCategoryWithRelations, Season} from '@/types';

import {ClubCategoriesModal} from './components/ClubCategoriesModal';

const t = translations.admin.clubCategories;

export default function ClubCategoriesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  const {data: clubCategories, loading: fetchLoading, refetch} = useFetchClubCategories();
  const clubCategoryForm = useClubCategoryForm();
  const {data: clubs} = useFetchClubs();
  const {data: categories} = useFetchCategories();
  const {data: seasons} = useFetchSeasons();
  const {loading, createClubCategory, updateClubCategory, deleteClubCategory} = useClubCategories();
  const {data: filteredClubCategories} = useClubCategoryFiltering(clubCategories, {
    searchTerm,
    selectedSeason,
  });

  const {isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose} = useDisclosure();
  const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

  const handleAddClick = () => {
    clubCategoryForm.openAddMode();
    onModalOpen();
  };

  const handleEditClick = (data: ClubCategorySchema) => {
    clubCategoryForm.openEditMode(data);
    onModalOpen();
  };

  const handleDeleteClick = (data: ClubCategorySchema) => {
    clubCategoryForm.openEditMode(data);
    onDeleteOpen();
  };

  const handleSubmit = async () => {
    if (
      !clubCategoryForm.formData.club_id ||
      !clubCategoryForm.formData.category_id ||
      !clubCategoryForm.formData.season_id
    ) {
      return;
    }

    try {
      if (clubCategoryForm.modalMode === ModalMode.EDIT && clubCategoryForm.selectedClubCategory) {
        await updateClubCategory(
          clubCategoryForm.selectedClubCategory.id,
          clubCategoryForm.formData
        );
      } else {
        await createClubCategory(clubCategoryForm.formData);
      }
      await refetch();
      onModalClose();
      clubCategoryForm.resetForm();
    } catch (error) {
      showToast.danger('Chyba při ukládání přiřazení kategorie klubu.');
    }
  };

  const handleConfirmDelete = async () => {
    if (clubCategoryForm.selectedClubCategory) {
      await deleteClubCategory(clubCategoryForm.selectedClubCategory.id);
      await refetch();
      onDeleteClose();
      clubCategoryForm.resetForm();
    }
  };

  const filters = () => {
    return (
      <div className="grid grid-cols-2 gap-4 w-full">
        <Input
          label={t.filters.searchLabel}
          placeholder={t.filters.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="sm"
        />
        <Select
          size="sm"
          label={t.filters.season}
          placeholder={t.filters.seasonPlaceholder}
          selectedKeys={selectedSeason ? [selectedSeason] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as string;
            setSelectedSeason(selectedKey || '');
          }}
          className="w-full"
        >
          {seasons.map((season: Season) => (
            <SelectItem key={season.id}>{season.name}</SelectItem>
          ))}
        </Select>
      </div>
    );
  };

  const clubCategoryColumns = [
    {key: 'club', label: t.table.club},
    {key: 'category', label: t.table.category},
    {key: 'season', label: t.table.season},
    {key: 'max_teams', label: t.table.maxTeams},
    {
      key: 'actions',
      label: t.table.actions,
      align: ColumnAlignType.CENTER,
      isActionColumn: true,
      actions: [
        {
          type: ActionTypes.UPDATE,
          onPress: handleEditClick,
          title: 'Upravit přiřazení',
        },
        {
          type: ActionTypes.DELETE,
          onPress: handleDeleteClick,
          title: 'Smazat přiřazení',
        },
      ],
    },
  ];

  const renderClubCategoryCell = (clubCategory: ClubCategoryWithRelations, columnKey: string) => {
    switch (columnKey) {
      case 'club':
        return <span className="font-medium">{clubCategory.club?.name}</span>;
      case 'category':
        return <span className="font-medium">{clubCategory.category?.name}</span>;
      case 'season':
        return <span className="font-medium">{clubCategory.season?.name}</span>;
      case 'max_teams':
        return <span className="font-medium">{clubCategory.max_teams}</span>;
    }
  };

  return (
    <>
      <AdminContainer
        loading={loading}
        filters={filters()}
        actions={[
          {
            label: t.addClubCategory,
            onClick: handleAddClick,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
      >
        <UnifiedTable
          columns={clubCategoryColumns}
          data={filteredClubCategories}
          ariaLabel={t.title}
          renderCell={renderClubCategoryCell}
          getKey={(clubCategory: ClubCategorySchema) => clubCategory.id}
          emptyContent={t.table.noClubCategories}
          isStriped
          isLoading={fetchLoading}
        />
      </AdminContainer>

      <ClubCategoriesModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        onPress={handleSubmit}
        mode={clubCategoryForm.modalMode}
        formData={clubCategoryForm.formData}
        setFormData={clubCategoryForm.setFormData}
        clubs={clubs}
        categories={categories}
        seasons={seasons}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleConfirmDelete}
        title={t.deleteClubCategory}
        message={t.deleteClubCategoryMessage}
      />
    </>
  );
}
