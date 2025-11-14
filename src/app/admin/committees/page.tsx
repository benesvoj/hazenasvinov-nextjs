'use client';

import React from 'react';

import {useDisclosure} from '@heroui/react';

import {translations} from '@/lib/translations';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useCommitteeForm, useCommittees, useFetchCommittees} from '@/hooks';
import {Committee} from '@/types';

import {CommitteeModal} from './components/CommitteeModal';

export default function CommitteesAdminPage() {
  // Data
  const {data, loading: committeesLoading, refetch} = useFetchCommittees();

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

  const t = translations.admin.committees;
  const tAction = translations.action;

  // Modal states/controls
  const {
    isOpen: isCommitteeModalOpen,
    onOpen: onCommitteeModalOpen,
    onClose: onCommitteeModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteCommitteeOpen,
    onOpen: onDeleteCommitteeOpen,
    onClose: onDeleteCommitteeClose,
  } = useDisclosure();

  // Handle modal open for add
  const handleAddClick = () => {
    openAddMode();
    onCommitteeModalOpen();
  };

  // Handle modal open for edit
  const handleEditClick = (committee: Committee) => {
    openEditMode(committee);
    onCommitteeModalOpen();
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
      onCommitteeModalClose();
      resetForm();
      setCrudLoading(false);
    } catch (error) {
      // Error already handled in hook
    }
  };

  // Handle delete
  const handleDeleteClick = (committee: Committee) => {
    openEditMode(committee); // Set selected committee
    onDeleteCommitteeOpen();
  };

  const handleConfirmDelete = async () => {
    if (selectedCommittee) {
      await deleteCommittee(selectedCommittee.id);
      await refetch();
      onDeleteCommitteeClose();
      resetForm();
      setCrudLoading(false);
    }
  };

  const committeeColumns = [
    {key: 'code', label: t.table.code},
    {key: 'name', label: t.table.name},
    {key: 'description', label: t.table.description},
    {key: 'status', label: t.table.status},
    {key: 'sort_order', label: t.table.sortOrder},
    {
      key: 'actions',
      label: t.table.actions,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.UPDATE, onPress: handleEditClick, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: handleDeleteClick, title: tAction.delete},
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
            {committee.is_active ? t.table.activeLabel : t.table.inactiveLabel}
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
            label: t.addCommittee,
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
          ariaLabel={t.title}
          renderCell={renderCommitteeCell}
          getKey={(committee: Committee) => committee.id}
          emptyContent={t.table.noCommittees}
          isStriped
        />
      </AdminContainer>

      <CommitteeModal
        isOpen={isCommitteeModalOpen}
        onClose={onCommitteeModalClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        mode={modalMode}
        isLoading={crudLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteCommitteeOpen}
        onClose={onDeleteCommitteeClose}
        onConfirm={handleConfirmDelete}
        title={t.deleteCommittee}
        message={t.deleteCommitteeMessage}
        isLoading={crudLoading}
      />
    </>
  );
}
