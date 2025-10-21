'use client';

import React from 'react';

import {Tab, Tabs} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {useAppData} from '@/contexts';
import {Genders, ModalMode} from '@/enums';
import {useMembers} from '@/hooks';
import {translations} from '@/lib';
import {BaseMember} from '@/types';

import MemberInfoTab from './MemberInfoTab';
import MemberPaymentsTab from './MemberPaymentsTab';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: BaseMember;
  setFormData: (data: BaseMember) => void;
  mode: ModalMode;
}

export default function MemberDetailModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  mode,
}: MemberDetailModalProps) {
  const t = translations.members.modals;
  const {categories} = useAppData();
  const {createMember} = useMembers();

  const handleSave = async () => {
    try {
      if (mode === ModalMode.ADD) {
        await createMember(
          {
            name: formData.name,
            surname: formData.surname,
            registration_number: formData.registration_number ?? '',
            date_of_birth: formData.date_of_birth ?? undefined,
            sex: formData.sex ?? Genders.MALE,
            functions: formData.functions ?? [],
          },
          formData.category_id ?? undefined
        );
      }
      // For EDIT mode, parent handles the update via onSubmit

      onSubmit(); // Callback to parent to save/refresh
      onClose();
    } catch (error) {
      console.log('Failed to save member:', error);
    }
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      onPress={handleSave}
      size={'4xl'}
      title={
        mode === ModalMode.ADD
          ? t.addMember
          : formData.id
            ? `${formData.registration_number} - ${formData.name} ${formData.surname}`
            : t.addMember
      }
      isFooterWithActions
    >
      <Tabs aria-label={t.tabsAriaLabel}>
        <Tab key="info" title={t.tabs.info}>
          <MemberInfoTab
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            mode={ModalMode.EDIT}
          />
        </Tab>
        <Tab key="payments" title={t.tabs.membershipFees} disabled={mode === ModalMode.ADD}>
          {mode !== ModalMode.ADD && <MemberPaymentsTab member={formData} />}
        </Tab>
      </Tabs>
    </UnifiedModal>
  );
}
