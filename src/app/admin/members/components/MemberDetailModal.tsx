'use client';

import React, {useEffect, useState} from 'react';

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
  member: BaseMember | null;
  mode: ModalMode;
}

export default function MemberDetailModal({
  isOpen,
  onClose,
  onSubmit,
  member,
  mode,
}: MemberDetailModalProps) {
  const t = translations.members.modals;
  const {categories} = useAppData();
  const {createMember, updateMember} = useMembers();

  // Default member for add mode
  const getDefaultMember = (): BaseMember => ({
    id: '',
    name: '',
    surname: '',
    registration_number: '',
    date_of_birth: null,
    sex: Genders.MALE,
    category_id: '',
    functions: [],
    created_at: '',
    updated_at: '',
    is_active: true,
  });

  const [formData, setFormData] = useState<BaseMember>(member || getDefaultMember());

  useEffect(() => {
    if (member) {
      setFormData(member);
    } else {
      setFormData(getDefaultMember());
    }
  }, [member]);

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
      } else {
        await updateMember({
          id: formData.id,
          name: formData.name,
          surname: formData.surname,
          registration_number: formData.registration_number ?? '',
          date_of_birth: formData.date_of_birth,
          sex: formData.sex ?? undefined,
          functions: formData.functions ?? [],
          category_id: formData.category_id ?? undefined,
        });
      }
      onSubmit(); // Callback to parent
      onClose();
    } catch (error) {
      console.log('Failed to save member:', error);
    }
  };

  if (!member) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      onPress={handleSave}
      size={'4xl'}
      title={
        mode === ModalMode.ADD
          ? t.addMember
          : `${member.registration_number} - ${member.name} ${member.surname}`
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
