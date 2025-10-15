'use client';
import React, {useEffect, useState} from 'react';

import {useCustomModal} from '@/components/ui/modals/UnifiedModal';

import {AdminContainer, UnifiedTable, DeleteConfirmationModal, GrantModal} from '@/components';
import {ActionTypes} from '@/enums';
import {useGrants} from '@/hooks';
import {translations} from '@/lib';
import {Grant} from '@/types';

export default function GrantCalendar() {
  const t = translations.grantCalendar;
  const tAction = translations.action;
  const {grants, loading, error, fetchGrants, createGrant, updateGrant, deleteGrant} = useGrants();

  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const grantModal = useCustomModal();
  const deleteModal = useCustomModal();

  useEffect(() => {
    fetchGrants();
  }, [fetchGrants]);

  const handleAddClick = () => {
    setModalMode('create');
    setSelectedGrant(null);
    grantModal.onOpen();
  };

  const handleEditClick = (grant: Grant) => {
    setModalMode('edit');
    setSelectedGrant(grant);
    grantModal.onOpen();
  };

  const handleDeleteClick = (grant: Grant) => {
    setSelectedGrant(grant);
    deleteModal.onOpen();
  };

  const handleSaveGrant = async (grantData: {
    name: string;
    description?: string;
    month: number;
  }) => {
    if (modalMode === 'create') {
      await createGrant(grantData);
    } else if (selectedGrant) {
      await updateGrant(selectedGrant.id, grantData);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedGrant) {
      try {
        await deleteGrant(selectedGrant.id);
        deleteModal.onClose();
      } catch (error) {
        console.error('Failed to delete grant:', error);
      }
    }
  };

  const monthNames = [
    t.months.january,
    t.months.february,
    t.months.march,
    t.months.april,
    t.months.may,
    t.months.june,
    t.months.july,
    t.months.august,
    t.months.september,
    t.months.october,
    t.months.november,
    t.months.december,
  ];

  const grantTableColumns = [
    {key: 'month', label: t.table.column.month},
    {key: 'name', label: t.table.column.name},
    {key: 'description', label: t.table.column.description},
    {
      key: 'actions',
      label: t.table.column.actions,
      isActionColumn: true,
      actions: [
        {
          type: ActionTypes.UPDATE,
          onPress: (grant: Grant) => handleEditClick(grant),
          title: tAction.edit,
        },
        {
          type: ActionTypes.DELETE,
          onPress: (grant: Grant) => handleDeleteClick(grant),
          title: tAction.delete,
        },
      ],
    },
  ];

  const renderGrantTableData = (grantData: Grant, columnKey: string) => {
    switch (columnKey) {
      case 'month':
        return <span className="font-medium">{monthNames[grantData.month - 1]}</span>;
      case 'name':
        return <span className="font-medium">{grantData.name}</span>;
      case 'description':
        return <span className="font-medium">{grantData.description || '-'}</span>;
    }
  };

  return (
    <>
      <AdminContainer
        actions={[
          {
            label: t.addGrant,
            onClick: handleAddClick,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
      >
        <UnifiedTable
          columns={grantTableColumns}
          renderCell={renderGrantTableData}
          data={grants}
          ariaLabel={t.title}
          getKey={(grant: Grant) => grant.id}
          emptyContent={t.table.noGrants}
          isStriped
          isLoading={loading}
        />
      </AdminContainer>

      <GrantModal
        isOpen={grantModal.isOpen}
        onClose={grantModal.onClose}
        onSave={handleSaveGrant}
        grant={selectedGrant}
        mode={modalMode}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleConfirmDelete}
        title={t.modal.deleteTitle}
        message={t.modal.deleteMessage}
      />
    </>
  );
}
