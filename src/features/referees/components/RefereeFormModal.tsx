import React from 'react';

import {Checkbox, Input} from '@heroui/react';

import {translations} from '@/lib/translations';

import {Choice, UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {MemberInternal} from '@/types';

export interface RefereeFormData {
  name: string;
  surname: string;
  member_id: string | null;
  is_active: boolean;
}

interface RefereeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  loading?: boolean;
  mode: ModalMode;
  formData: RefereeFormData;
  setFormData: (data: RefereeFormData) => void;
  members: MemberInternal[];
}

const tR = translations.referees;

export default function RefereeFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  mode,
  formData,
  setFormData,
  members,
}: RefereeFormModalProps) {
  const modalTitle = mode === ModalMode.EDIT ? tR.modal.editTitle : tR.modal.addTitle;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      isFooterWithActions
      onPress={onSubmit}
      isLoading={loading}
      size="sm"
    >
      <div className="space-y-4">
        <Input
          label={tR.modal.formFields.surname}
          placeholder={tR.modal.formFields.surnamePlaceholder}
          value={formData.surname}
          onChange={(e) => setFormData({...formData, surname: e.target.value})}
          isRequired
        />
        <Input
          label={tR.modal.formFields.name}
          placeholder={tR.modal.formFields.namePlaceholder}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
        />
        <Choice
          items={members
            .filter((m) => m.id != null)
            .map((m) => ({key: m.id as string, label: `${m.surname} ${m.name}`}))}
          value={formData.member_id}
          onChange={(id) => {
            const member = id ? members.find((m) => m.id === id) : null;
            setFormData({
              ...formData,
              member_id: id,
              surname: member ? (member.surname ?? formData.surname) : formData.surname,
              name: member ? (member.name ?? formData.name) : formData.name,
            });
          }}
          label={tR.modal.formFields.memberId}
          placeholder={tR.modal.formFields.memberIdPlaceholder}
        />
        <Checkbox
          isSelected={formData.is_active}
          onValueChange={(checked) => setFormData({...formData, is_active: checked})}
        >
          {tR.modal.formFields.isActive}
        </Checkbox>
      </div>
    </UnifiedModal>
  );
}
