'use client';

import React, {useState} from 'react';

import {useModal, useModalWithItem} from '@/hooks/shared/useModals';

import {translations} from '@/lib/translations';

import {AdminContainer, DeleteConfirmationModal, showToast, UnifiedTable} from '@/components';
import {ActionTypes, ColumnAlignType, MemberFunction, ModalMode} from '@/enums';
import {useFetchMembersInternal, useFetchReferees, useReferees} from '@/hooks';
import {Referee} from '@/types';

import RefereeFormModal, {RefereeFormData} from './components/RefereeFormModal';

const tR = translations.referees;
const tAction = translations.common.actions;

const EMPTY_FORM: RefereeFormData = {
  name: '',
  surname: '',
  member_id: null,
  is_active: true,
};

export function RefereesAdminContainer() {
  const {data: refereesData, loading: refereesLoading, refetch} = useFetchReferees();
  const {data: members} = useFetchMembersInternal({
    filters: {function: MemberFunction.REFEREE},
    limit: 200,
  });
  const {loading: crudLoading, createReferee, updateReferee, deleteReferee} = useReferees();

  const [formData, setFormData] = useState<RefereeFormData>(EMPTY_FORM);
  const [selectedReferee, setSelectedReferee] = useState<Referee | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(ModalMode.ADD);

  const modal = useModal();
  const deleteModal = useModalWithItem<Referee>();

  const handleAdd = () => {
    setFormData(EMPTY_FORM);
    setModalMode(ModalMode.ADD);
    modal.onOpen();
  };

  const handleEdit = (referee: Referee) => {
    setSelectedReferee(referee);
    setFormData({
      name: referee.name,
      surname: referee.surname,
      member_id: referee.member_id,
      is_active: referee.is_active,
    });
    setModalMode(ModalMode.EDIT);
    modal.onOpen();
  };

  const handleDelete = (referee: Referee) => {
    deleteModal.openWith(referee);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.selectedItem) return;
    const success = await deleteReferee(deleteModal.selectedItem.id);
    if (success) {
      await refetch();
      deleteModal.closeAndClear();
    }
  };

  const handleSubmit = async () => {
    if (!formData.surname.trim() || !formData.name.trim()) {
      showToast.danger(translations.common.responseMessages.unknownError);
      return;
    }

    try {
      if (modalMode === ModalMode.EDIT && selectedReferee) {
        await updateReferee(selectedReferee.id, formData);
      } else {
        await createReferee(formData);
      }
      await refetch();
      modal.onClose();
      setFormData(EMPTY_FORM);
      setSelectedReferee(null);
    } catch {
      showToast.danger(translations.common.responseMessages.unknownError);
    }
  };

  const columns = [
    {key: 'surname', label: tR.table.header.name},
    {key: 'name', label: tR.table.header.surname},
    {key: 'member', label: tR.table.header.member},
    {key: 'is_active', label: tR.table.header.status},
    {
      key: 'actions',
      label: tR.table.header.actions,
      align: ColumnAlignType.CENTER,
      isActionColumn: true,
      actions: [
        {type: ActionTypes.UPDATE, onPress: handleEdit, title: tAction.edit},
        {type: ActionTypes.DELETE, onPress: handleDelete, title: tAction.delete},
      ],
    },
  ];

  const renderCell = (referee: Referee, columnKey: string) => {
    switch (columnKey) {
      case 'surname':
        return <span className="font-medium">{referee.surname}</span>;
      case 'name':
        return <span>{referee.name}</span>;
      case 'member': {
        if (!referee.member_id) return <span className="text-default-400">—</span>;
        const member = members.find((m) => m.id === referee.member_id);
        return <span>{member ? `${member.surname} ${member.name}` : '—'}</span>;
      }
      case 'is_active':
        return <span>{referee.is_active ? tR.status.active : tR.status.inactive}</span>;
    }
    return null;
  };

  return (
    <>
      <AdminContainer
        isLoading={refereesLoading}
        actions={[
          {
            label: tAction.add,
            onClick: handleAdd,
            variant: 'solid',
            buttonType: ActionTypes.CREATE,
          },
        ]}
      >
        <UnifiedTable
          isLoading={refereesLoading}
          columns={columns}
          data={refereesData}
          ariaLabel={tR.table.ariaLabel}
          renderCell={renderCell}
          getKey={(referee: Referee) => referee.id}
          emptyContent={tR.emptyState.title}
          isStriped
        />
      </AdminContainer>

      <RefereeFormModal
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        mode={modalMode}
        loading={crudLoading}
        members={members}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleConfirmDelete}
        isLoading={crudLoading}
        title={tR.modal.deleteTitle}
        message={`${tR.modal.deleteDescription} ${deleteModal.selectedItem?.surname} ${deleteModal.selectedItem?.name}?`}
      />
    </>
  );
}
