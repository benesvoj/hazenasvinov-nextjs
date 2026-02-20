'use client';

import React from 'react';

import {useQuery} from '@tanstack/react-query';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations/index';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useCommitteeForm, useCommittees} from '@/hooks';
import {fetchCommittees} from '@/queries/committees/queries';
import {Committee} from '@/types';

import {CommitteeModal} from './components/CommitteeModal';

export function CommitteesPageClient() {
  // Data - NOW using React Query instead of useFetchCommittees
  const {
    data = [],
    isLoading: committeesLoading,
    refetch,
  } = useQuery({
    queryKey: ['committees'],
    queryFn: fetchCommittees,
  });

  // CRUD operations
  const {
    loading: crudLoading,
    setLoading: setCrudLoading,
    createCommittee,
    updateCommittee,
    deleteCommittee,
  } = useCommittees();

  // Form state management
  const {
    formData,
    selectedItem: selectedCommittee,
    modalMode,
    setFormData,
    openAddMode,
    openEditMode,
    resetForm,
    validateForm,
  } = useCommitteeForm();

  // Modal states - using helpers for cleaner code
  const committeeModal = useModal();
  const deleteModal = useModalWithItem<Committee>();

  // Handle modal open for add
  const handleAddClick = () => {
    openAddMode();
    committeeModal.onOpen();
  };

  // Handle modal open for edit
  const handleEditClick = (committee: Committee) => {
    openEditMode(committee);
    committeeModal.onOpen();
  };

  // Handle submit
  const handleSubmit = async () => {
    const {valid, errors} = validateForm();
    if (!valid) {
      console.error('Validation errors:', errors);
      return;
    }

    try {
      if (modalMode === ModalMode.EDIT && selectedCommittee) {
        await updateCommittee(selectedCommittee.id, formData);
        setCrudLoading(false);
      } else {
        await createCommittee(formData);
        setCrudLoading(false);
      }
      await refetch();
      committeeModal.onClose();
      resetForm();
      setCrudLoading(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Handle delete
  const handleDeleteClick = (committee: Committee) => {
    deleteModal.openWith(committee);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.selectedItem) return;

    const success = await deleteCommittee(deleteModal.selectedItem.id);

    if (success) {
      await refetch();
      deleteModal.closeAndClear();
    }
  };

  const committeeColumns = [
    {key: 'code', label: translations.committees.table.code},
    {key: 'name', label: translations.committees.table.name},
    {key: 'description', label: translations.committees.table.description},
    {key: 'status', label: translations.committees.table.status},
    {key: 'sort_order', label: translations.committees.table.sortOrder},
    {
      key: 'actions',
      label: translations.common.table.columns.actions,
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

  const renderCommitteeCell = (committee: Committee, columnKey: string) => {
    switch (columnKey) {
      case 'code':
        return <span className="font-medium">{committee.code}</span>;
      case 'name':
        return <span className="font-medium">{committee.name}</span>;
      case 'description':
        return <span className="font-medium">{committee.description || '-'}</span>;
      case 'status':
        return (
          <span className="font-medium">
            {committee.is_active
              ? translations.committees.table.activeLabel
              : translations.committees.table.inactiveLabel}
          </span>
        );
      case 'sort_order':
        return <span className="font-medium">{committee.sort_order}</span>;
    }
  };

  return (
    <>
      <AdminContainer
        actions={[
          {
            label: translations.committees.addCommittee,
            onClick: handleAddClick,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
      >
        <UnifiedTable
          isLoading={committeesLoading}
          columns={committeeColumns}
          data={data}
          ariaLabel={translations.committees.title}
          renderCell={renderCommitteeCell}
          getKey={(committee: Committee) => committee.id}
          emptyContent={translations.committees.table.noCommittees}
          isStriped
        />
      </AdminContainer>

      <CommitteeModal
        isOpen={committeeModal.isOpen}
        onClose={committeeModal.onClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        mode={modalMode}
        isLoading={crudLoading}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeAndClear}
        onConfirm={handleConfirmDelete}
        title={translations.committees.deleteCommittee}
        message={translations.committees.deleteCommitteeMessage}
        isLoading={crudLoading}
      />
    </>
  );
}
