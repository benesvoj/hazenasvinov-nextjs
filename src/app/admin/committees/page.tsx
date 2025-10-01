'use client';

import React, {useEffect, useState} from 'react';

import {useDisclosure, Button} from '@heroui/react';

import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {AdminContainer, DeleteConfirmationModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {useCommittees} from '@/hooks';
import {Committee} from '@/types';

import {CommitteeModal} from './components/CommitteeModal';

export default function CommitteesAdminPage() {
  const {
    committees,
    loading,
    error,
    formData,
    fetchCommittees,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    openEditModal,
    openDeleteModal,
    resetForm,
    setFormData,
  } = useCommittees();

  const t = translations.admin.committees;
  const tAction = translations.action;

  useEffect(() => {
    fetchCommittees();
  }, [fetchCommittees]);

  // Modal states
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);
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
    setModalMode(ModalMode.ADD);
    resetForm();
    onCommitteeModalOpen();
  };

  // Handle modal open for edit
  const handleEditClick = (committee: Committee) => {
    setModalMode(ModalMode.EDIT);
    openEditModal(committee);
    onCommitteeModalOpen();
  };

  // Handle modal close
  const handleCommitteeModalClose = () => {
    onCommitteeModalClose();
    resetForm();
  };

  // Handle committee submission
  const handleCommitteeSubmit = async () => {
    if (modalMode === ModalMode.ADD) {
      await addCommittee();
    } else {
      await updateCommittee();
    }
    handleCommitteeModalClose();
  };

  // Handle delete
  const handleDeleteClick = (committee: Committee) => {
    openDeleteModal(committee);
    onDeleteCommitteeOpen();
  };

  const handleDeleteCommittee = async () => {
    await deleteCommittee();
    onDeleteCommitteeClose();
  };

  const commiteeColumns = [
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
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <UnifiedTable
        isLoading={loading}
        columns={commiteeColumns}
        data={committees}
        ariaLabel={t.title}
        renderCell={renderCommitteeCell}
        getKey={(committee: Committee) => committee.id}
        emptyContent={t.table.noCommittees}
        isStriped
      />

      {/* Committee Modal (Add/Edit) */}
      <CommitteeModal
        isOpen={isCommitteeModalOpen}
        onClose={handleCommitteeModalClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCommitteeSubmit}
        mode={modalMode}
      />

      {/* Delete Committee Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteCommitteeOpen}
        onClose={onDeleteCommitteeClose}
        onConfirm={handleDeleteCommittee}
        title={t.deleteCommittee}
        message={t.deleteCommitteeMessage}
      />
    </AdminContainer>
  );
}
