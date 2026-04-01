'use client';

import React from 'react';

import {useQuery} from '@tanstack/react-query';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {PlusIcon} from '@/lib/icons';
import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {ModalMode} from '@/enums';
import {useCommitteeForm, useCommittees} from '@/hooks';
import {fetchCommittees} from '@/queries/committees/queries';
import {AppPageLayout, FloatingActions} from '@/shared/components';
import {Committee} from '@/types';

import {CommitteeModal} from '../components/CommitteeModal';
import {CommitteesTable} from '../components/CommitteesTable';

export function CommitteesContainer() {
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

  return (
    <>
      <AppPageLayout
        floatingActions={
          <FloatingActions
            actions={[
              {
                label: translations.committees.addCommittee,
                onClick: handleAddClick,
                icon: <PlusIcon className={'h-4 w-4'} />,
              },
            ]}
          />
        }
      >
        <CommitteesTable
          data={data}
          isLoading={committeesLoading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </AppPageLayout>

      <CommitteeModal
        isOpen={committeeModal.isOpen}
        onClose={committeeModal.onClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        mode={modalMode}
        isLoading={crudLoading}
      />

      <Dialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeAndClear}
        title={translations.committees.deleteCommittee}
        onSubmit={handleConfirmDelete}
        isLoading={crudLoading}
        dangerAction
        submitButtonLabel={translations.common.actions.delete}
      >
        {translations.committees.deleteCommitteeMessage}
      </Dialog>
    </>
  );
}
