'use client';

import React, {useState} from 'react';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import {AdminContainer, Choice, Dialog, Search, showToast, UnifiedTable} from '@/components';
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
import {ClubCategorySchema, ClubCategoryWithRelations} from '@/types';

import {ClubCategoriesModal} from './components/ClubCategoriesModal';

const t = translations.clubCategories;

export default function ClubCategoriesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  const {data: clubCategories, loading: fetchLoading, refetch} = useFetchClubCategories();
  const {
    selectedItem: selectedClubCategory,
    formData,
    setFormData,
    resetForm,
    modalMode,
    openAddMode,
    openEditMode,
  } = useClubCategoryForm();
  const {data: clubs} = useFetchClubs();
  const {data: categories} = useFetchCategories();
  const {data: seasons} = useFetchSeasons();
  const {loading, createClubCategory, updateClubCategory, deleteClubCategory} = useClubCategories();
  const {data: filteredClubCategories} = useClubCategoryFiltering(clubCategories, {
    searchTerm,
    selectedSeason,
  });

  const modal = useModal();
  const deleteModal = useModalWithItem<ClubCategorySchema>();

  const handleAddClick = () => {
    openAddMode();
    modal.onOpen();
  };

  const handleEditClick = (data: ClubCategorySchema) => {
    openEditMode(data);
    modal.onOpen();
  };

  const handleDeleteClick = (data: ClubCategorySchema) => {
    openEditMode(data);
    deleteModal.onOpen();
  };

  const handleSubmit = async () => {
    if (!formData.club_id || !formData.category_id || !formData.season_id) {
      return;
    }

    try {
      if (modalMode === ModalMode.EDIT && selectedClubCategory) {
        await updateClubCategory(selectedClubCategory.id, formData);
      } else {
        await createClubCategory(formData);
      }
      await refetch();
      modal.onClose();
      resetForm();
    } catch (error) {
      showToast.danger('Chyba při ukládání přiřazení kategorie klubu.');
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedClubCategory) {
      await deleteClubCategory(selectedClubCategory.id);
      await refetch();
      deleteModal.onClose();
      resetForm();
    }
  };

  const seasonOptions = seasons.map((season) => ({key: season.id, label: season.name}));

  const filters = () => {
    return (
      <div className="flex justify-between gap-4 w-full items-center">
        <Search
          label={t.filters.searchLabel}
          placeholder={t.filters.searchPlaceholder}
          value={searchTerm}
          onChange={setSearchTerm}
          className="max-w-md flex-1"
        />
        <Choice
          label={t.filters.season}
          placeholder={t.filters.seasonPlaceholder}
          items={seasonOptions}
          value={selectedSeason}
          onChange={(value) => setSelectedSeason(value || '')}
          className={'w-1/3'}
        />
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
          title: translations.common.actions.edit,
        },
        {
          type: ActionTypes.DELETE,
          onPress: handleDeleteClick,
          title: translations.common.actions.delete,
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
          ariaLabel={t.page.title}
          renderCell={renderClubCategoryCell}
          getKey={(clubCategory: ClubCategorySchema) => clubCategory.id}
          emptyContent={t.table.noClubCategories}
          isStriped
          isLoading={fetchLoading}
        />
      </AdminContainer>

      <ClubCategoriesModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onSubmit={handleSubmit}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        clubs={clubs}
        categories={categories}
        seasons={seasons}
        isLoading={loading}
      />

      <Dialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onSubmit={handleConfirmDelete}
        title={t.deleteClubCategory}
        isLoading={loading}
        submitButtonLabel={translations.common.actions.delete}
        dangerAction
        size={'sm'}
      >
        {t.deleteClubCategoryMessage}
      </Dialog>
    </>
  );
}
