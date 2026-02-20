'use client';

import React from 'react';

import {Chip} from '@heroui/react';

import {useQuery} from '@tanstack/react-query';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations/index';

import {
  AdminContainer,
  DeleteConfirmationModal,
  showToast,
  UnifiedCard,
  UnifiedTable,
} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {formatDateString} from '@/helpers';
import {useSeasonForm, useSeasons} from '@/hooks';
import {fetchSeasons} from '@/queries/seasons/queries';
import {Season, SeasonInsert} from '@/types';

import {SeasonModal} from './components/SeasonModal';

export function SeasonsPageClient() {
  // ✅ React Query - hydrated from server, also gets caching/refetch benefits
  const {
    data: seasons = [],
    isLoading: fetchLoading,
    refetch,
  } = useQuery({
    queryKey: ['seasons'],
    queryFn: fetchSeasons,
  });

  const {
    selectedItem: selectedSeason,
    formData,
    setFormData,
    resetForm,
    validateForm,
    modalMode,
    openAddMode,
    openEditMode,
  } = useSeasonForm();

  const {loading: crudLoading, createSeason, updateSeason, deleteSeason} = useSeasons();

  const modal = useModal();
  const deleteModal = useModalWithItem<Season>();

  // Handle modal open for add
  const handleAddClick = () => {
    openAddMode();
    modal.onOpen();
  };

  // Handle modal open for edit
  const handleEditClick = (season: Season) => {
    openEditMode(season);
    modal.onOpen();
  };

  // Handle season submission
  const handleSubmit = async () => {
    const {valid, errors} = validateForm();

    if (!valid) {
      errors.forEach((error) => showToast.danger(error));
      return;
    }

    try {
      if (modalMode === ModalMode.ADD) {
        const insertData: SeasonInsert = {
          ...formData,
        };
        await createSeason(insertData);
      } else {
        if (!selectedSeason) return;
        await updateSeason(selectedSeason.id, {
          id: selectedSeason.id,
          ...formData,
        });
      }
    } catch (error) {
      console.error('Error submitting season:', error);
    } finally {
      await refetch();
      resetForm();
      modal.onClose();
    }
  };

  // Handle delete
  const handleDeleteClick = (season: Season) => {
    deleteModal.openWith(season);
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.selectedItem) {
      const success = await deleteSeason(deleteModal.selectedItem.id);

      if (success) {
        await refetch();
        deleteModal.closeAndClear();
      }
    }
  };

  const columns = [
    {key: 'name', label: translations.seasons.table.name},
    {key: 'start_date', label: translations.seasons.table.startDate},
    {key: 'end_date', label: translations.seasons.table.endDate},
    {key: 'status', label: translations.seasons.table.status},
    {
      key: 'actions',
      label: translations.seasons.table.actions,
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
                ? translations.seasons.activeLabel
                : translations.seasons.inactiveLabel}
            </Chip>
            <Chip size="sm" color={season.is_closed ? 'default' : 'secondary'} variant="flat">
              {season.is_closed ? translations.seasons.closedLabel : translations.seasons.openLabel}
            </Chip>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AdminContainer
        loading={fetchLoading}
        actions={[
          {
            label: translations.seasons.labels.addSeason,
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
            ariaLabel={translations.seasons.title}
            renderCell={renderSeasonCell}
            getKey={(season) => season.id}
            isLoading={fetchLoading}
            emptyContent={translations.seasons.noSeasons}
            isStriped
          />
        </UnifiedCard>
      </AdminContainer>

      <SeasonModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        mode={modalMode}
        loading={crudLoading}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleDeleteConfirm}
        title={translations.seasons.modal.deleteSeasonTitle}
        message={translations.seasons.modal.deleteSeasonMessage}
      />
    </>
  );
}
