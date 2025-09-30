'use client';

import React, {useEffect, useState} from 'react';

import {useDisclosure, Chip, Button} from '@heroui/react';

import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {formatDateString} from '@/helpers/formatDate';

import {AdminContainer, DeleteConfirmationModal, UnifiedCard, UnifiedTable} from '@/components';
import {ButtonTypes, ModalMode} from '@/enums';
import {useSeasons} from '@/hooks';
import {Season} from '@/types';

import {SeasonModal} from './components/SeasonModal';

export default function SeasonsAdminPage() {
  const {
    seasons,
    loading,
    error,
    selectedSeason,
    formData,
    fetchAllSeasons,
    addSeason,
    updateSeason,
    deleteSeason,
    openEditModal,
    openDeleteModal,
    resetForm,
    setFormData,
  } = useSeasons();

  useEffect(() => {
    fetchAllSeasons();
  }, [fetchAllSeasons]);

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);
  const {
    isOpen: isSeasonModalOpen,
    onOpen: onSeasonModalOpen,
    onClose: onSeasonModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteSeasonOpen,
    onOpen: onDeleteSeasonOpen,
    onClose: onDeleteSeasonClose,
  } = useDisclosure();

  // Handle modal open for add
  const handleAddClick = () => {
    setModalMode(ModalMode.ADD);
    resetForm();
    onSeasonModalOpen();
  };

  // Handle modal open for edit
  const handleEditClick = (season: Season) => {
    setModalMode(ModalMode.EDIT);
    openEditModal(season);
    onSeasonModalOpen();
  };

  // Handle modal close
  const handleSeasonModalClose = () => {
    onSeasonModalClose();
    resetForm();
  };

  // Handle season submission
  const handleSeasonSubmit = async () => {
    if (modalMode === ModalMode.ADD) {
      await addSeason();
    } else {
      await updateSeason();
    }
    handleSeasonModalClose();
  };

  // Handle delete
  const handleDeleteClick = (season: Season) => {
    openDeleteModal(season);
    onDeleteSeasonOpen();
  };

  const handleDeleteSeason = async () => {
    await deleteSeason();
    onDeleteSeasonClose();
  };

  const columns = [
    {key: 'name', label: translations.season.table.name},
    {key: 'start_date', label: translations.season.table.startDate},
    {key: 'end_date', label: translations.season.table.endDate},
    {key: 'status', label: translations.season.table.status},
    {key: 'actions', label: translations.season.table.actions},
  ];

  const renderSeasonCell = (season: Season, columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return <span className="font-medium">{season.name}</span>;
      case 'start_date':
        return <span className="font-medium">{formatDateString(season.start_date || '')}</span>;
      case 'end_date':
        return <span className="font-medium">{formatDateString(season.end_date || '')}</span>;
      case 'status':
        return (
          <div className="flex gap-1">
            <Chip size="sm" color={season.is_active ? 'success' : 'default'} variant="flat">
              {season.is_active
                ? translations.season.activeLabel
                : translations.season.inactiveLabel}
            </Chip>
            <Chip size="sm" color={season.is_closed ? 'default' : 'secondary'} variant="flat">
              {season.is_closed ? translations.season.closedLabel : translations.season.openLabel}
            </Chip>
          </div>
        );
      case 'actions':
        return (
          <div className="flex justify-center gap-2">
            <Button
              title={translations.season.editSeason}
              size="sm"
              variant="light"
              color="primary"
              isIconOnly
              startContent={<PencilIcon className="w-4 h-4" />}
              onPress={() => handleEditClick(season)}
            />
            <Button
              title={translations.season.deleteSeason}
              size="sm"
              variant="light"
              color="danger"
              isIconOnly
              startContent={<TrashIcon className="w-4 h-4" />}
              onPress={() => handleDeleteClick(season)}
            />
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <AdminContainer
      loading={loading}
      actions={[
        {
          label: translations.season.addSeason,
          onClick: handleAddClick,
          variant: 'solid',
          buttonType: ButtonTypes.CREATE,
        },
      ]}
    >
      <UnifiedCard>
        <UnifiedTable
          columns={columns}
          data={seasons}
          ariaLabel={translations.season.title}
          renderCell={renderSeasonCell}
          getKey={(season) => season.id}
          isLoading={loading}
          emptyContent={translations.season.noSeasons}
          isStriped
        />
      </UnifiedCard>

      {/* Season Modal (Add/Edit) */}
      <SeasonModal
        isOpen={isSeasonModalOpen}
        onClose={handleSeasonModalClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSeasonSubmit}
        mode={modalMode}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteSeasonOpen}
        onClose={onDeleteSeasonClose}
        onConfirm={handleDeleteSeason}
        title={translations.season.deleteSeason}
        message={translations.season.deleteSeasonMessage}
      />
    </AdminContainer>
  );
}
