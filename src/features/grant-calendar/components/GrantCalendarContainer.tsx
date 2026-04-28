'use client';
import React from 'react';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import {Dialog, GrantModal, UnifiedTable} from '@/components';
import {ActionTypes, ModalMode} from '@/enums';
import {getMonthName} from '@/helpers';
import {useFetchGrants, useGrantForm, useGrants} from '@/hooks';
import {PlusIcon} from '@/lib';
import {AppPageLayout, FloatingActions} from '@/shared/components';
import {commonCopy} from '@/shared/copy';
import {Grant} from '@/types';

export function GrantCalendarContainer() {
  const t = translations.grantCalendar;
  const tAction = translations.common.actions;

  const {data: grants, loading, refetch} = useFetchGrants();
  const {
    createGrant,
    updateGrant,
    deleteGrant,
    setLoading: setCRUDLoading,
    loading: crudLoading,
  } = useGrants();
  const {
    modalMode,
    selectedItem: selectedGrant,
    openAddMode,
    openEditMode,
    validateForm,
    formData,
    setFormData,
    resetForm,
  } = useGrantForm();

  const grantModal = useModal();
  const deleteModal = useModalWithItem<Grant>();

  const handleAddClick = () => {
    openAddMode();
    grantModal.onOpen();
  };

  const handleEditClick = (item: Grant) => {
    openEditMode(item);
    grantModal.onOpen();
  };

  const handleSubmit = async () => {
    const {valid, errors} = validateForm();
    if (!valid) {
      console.error('Form validation errors:', errors);
      return;
    }

    try {
      if (modalMode === ModalMode.EDIT && selectedGrant) {
        await updateGrant(selectedGrant.id, formData);
        setCRUDLoading(false);
      } else {
        await createGrant(formData);
        setCRUDLoading(false);
      }
      await refetch();
      grantModal.onClose();
      resetForm();
      setCRUDLoading(false);
    } catch (error) {
      console.error('Failed to save grant:', error);
    }
  };

  const handleDeleteClick = (item: Grant) => {
    openEditMode(item);
    deleteModal.onOpen();
  };

  const handleConfirmDelete = async () => {
    if (selectedGrant) {
      await deleteGrant(selectedGrant.id);
      await refetch();
      deleteModal.onClose();
      resetForm();
      setCRUDLoading(false);
    }
  };

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
        return <span className="font-medium">{getMonthName(grantData.month)}</span>;
      case 'name':
        return <span className="font-medium">{grantData.name}</span>;
      case 'description':
        return <span className="font-medium">{grantData.description || '-'}</span>;
    }
  };

  return (
    <>
      <AppPageLayout
        floatingActions={
          <FloatingActions
            actions={[
              {
                label: commonCopy.actions.add,
                icon: <PlusIcon className="w-4 h-4" />,
                onClick: handleAddClick,
              },
            ]}
          />
        }
      >
        <UnifiedTable
          columns={grantTableColumns}
          renderCell={renderGrantTableData}
          data={grants}
          ariaLabel={t.page.title}
          getKey={(grant: Grant) => grant.id}
          emptyContent={t.table.noGrants}
          isStriped
          isLoading={loading}
        />
      </AppPageLayout>

      <GrantModal
        isOpen={grantModal.isOpen}
        onClose={grantModal.onClose}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        mode={modalMode}
        isLoading={crudLoading}
      />

      <Dialog
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onSubmit={handleConfirmDelete}
        title={t.modal.deleteTitle}
        dangerAction
        submitButtonLabel={commonCopy.actions.delete}
        isLoading={crudLoading}
        size={'sm'}
      >
        {t.modal.deleteMessage}
      </Dialog>
    </>
  );
}
