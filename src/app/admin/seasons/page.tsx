'use client';

import React, {useEffect, useState} from 'react';

import {Chip, useDisclosure} from '@heroui/react';

import {translations} from '@/lib/translations';

import {formatDateString} from '@/helpers/formatDate';

import {AdminContainer, DeleteConfirmationModal, UnifiedCard, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useFetchSeasons, useSeasons} from '@/hooks';
import {Season} from '@/types';

import {SeasonModal} from './components/SeasonModal';

export default function SeasonsAdminPage() {
  const tAction = translations.action;
  const {
    loading,
    formData,
    addSeason,
    updateSeason,
    deleteSeason,
    openEditModal,
    openDeleteModal,
    resetForm,
    setFormData,
  } = useSeasons();

  const {data: seasons, refetch: fetchAllSeasons} = useFetchSeasons();

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
    {
      key: 'actions',
      label: translations.season.table.actions,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.UPDATE, onPress: handleEditClick, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: handleDeleteClick, title: tAction.delete},
      ],
    },
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
          buttonType: ActionTypes.CREATE,
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
