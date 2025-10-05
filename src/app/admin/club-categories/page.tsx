'use client';

import React, {useState} from 'react';

import {Button} from '@heroui/button';
import {Input} from '@heroui/input';
import {useDisclosure} from '@heroui/modal';
import {Select, SelectItem} from '@heroui/react';

import {translations} from '@/lib/translations';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType, ModalMode as ModalModeEnum} from '@/enums';
import {useClubCategories} from '@/hooks';
import {ClubCategory} from '@/types';

import {ClubCategoriesModal} from './components/ClubCategoriesModal';

export default function ClubCategoriesAdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');

  const t = translations.admin.clubCategories;

  // Modal states
  const {isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose} = useDisclosure();
  const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

  const clubCategoryInitialFormData: ClubCategory = {
    club_id: '',
    category_id: '',
    season_id: '',
    max_teams: 1,
    id: '',
    is_active: true,
    club: null,
    category: null,
    season: null,
  };

  // Form states
  const [modalMode, setModalMode] = useState<ModalModeEnum>(ModalModeEnum.ADD);
  const [formData, setFormData] = useState(clubCategoryInitialFormData);
  const [clubCategoryToDelete, setClubCategoryToDelete] = useState<ClubCategory | null>(null);

  // Use the custom hook
  const {
    clubCategories,
    clubs,
    categories,
    seasons,
    loading,
    error,
    createClubCategory,
    updateClubCategory,
    deleteClubCategory,
    clearError,
  } = useClubCategories({
    searchTerm,
    selectedSeason,
  });

  // Set first season as default when seasons are loaded
  React.useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      setSelectedSeason(seasons[0].id);
    }
  }, [seasons, selectedSeason]);

  // Handle modal submit (both create and edit)
  const handleModalSubmit = async () => {
    if (!formData.club_id || !formData.category_id || !formData.season_id) {
      return;
    }

    let result;
    if (modalMode === ModalModeEnum.ADD) {
      result = await createClubCategory({
        club_id: formData.club_id,
        category_id: formData.category_id,
        season_id: formData.season_id,
        max_teams: formData.max_teams,
      });
    } else {
      result = await updateClubCategory({
        id: formData.id,
        club_id: formData.club_id,
        category_id: formData.category_id,
        season_id: formData.season_id,
        max_teams: formData.max_teams,
      });
    }

    if (result.success) {
      onModalClose();
      setFormData(clubCategoryInitialFormData);
      clearError();
    }
  };

  // Delete club category assignment
  const handleDeleteClubCategory = async () => {
    if (!clubCategoryToDelete) return;

    const result = await deleteClubCategory(clubCategoryToDelete.id);

    if (result.success) {
      onDeleteClose();
      setClubCategoryToDelete(null);
      clearError();
    }
  };

  // Open create modal
  const openCreateModal = () => {
    setModalMode(ModalModeEnum.ADD);
    setFormData(clubCategoryInitialFormData);
    onModalOpen();
  };

  // Open edit modal
  const openEditModal = (clubCategory: ClubCategory) => {
    setModalMode(ModalModeEnum.EDIT);
    setFormData({
      id: clubCategory.id,
      club_id: clubCategory.club_id,
      category_id: clubCategory.category_id,
      season_id: clubCategory.season_id,
      max_teams: clubCategory.max_teams,
      is_active: clubCategory.is_active,
      club: clubCategory.club,
      category: clubCategory.category,
      season: clubCategory.season,
    });
    onModalOpen();
  };

  // Open delete modal
  const openDeleteModal = (clubCategory: ClubCategory) => {
    setClubCategoryToDelete(clubCategory);
    onDeleteOpen();
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
          {seasons.map((season: any) => (
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
          onPress: openEditModal,
          title: 'Upravit přiřazení',
        },
        {
          type: ActionTypes.DELETE,
          onPress: openDeleteModal,
          title: 'Smazat přiřazení',
        },
      ],
    },
  ];

  const renderClubCategoryCell = (clubCategory: ClubCategory, columnKey: string) => {
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
            onClick: openCreateModal,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
      >
        <UnifiedTable
          columns={clubCategoryColumns}
          data={clubCategories}
          ariaLabel={t.title}
          renderCell={renderClubCategoryCell}
          getKey={(clubCategory: ClubCategory) => clubCategory.id}
          emptyContent={t.table.noClubCategories}
          isStriped
        />
      </AdminContainer>

      <ClubCategoriesModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        title={modalMode === ModalModeEnum.ADD ? t.modal.title : t.editClubCategory}
        onPress={handleModalSubmit}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        clubs={clubs}
        categories={categories}
        seasons={seasons}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDeleteClubCategory}
        title={t.deleteClubCategory}
        message={t.deleteClubCategoryMessage}
      />
    </>
  );
}
