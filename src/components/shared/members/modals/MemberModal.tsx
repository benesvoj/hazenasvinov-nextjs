'use client';

import React, {useEffect, useState} from 'react';

import {Tab, Tabs} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {UnifiedModal} from '@/components';
import {Genders} from '@/enums';
import {Category, Member} from '@/types';

import MemberInfoForm from './MemberInfoForm';
import MemberPaymentsTab from './MemberPaymentsTab';

const MEMBER_INITIAL_DATA: Member = {
  id: '',
  name: '',
  surname: '',
  registration_number: '',
  date_of_birth: null,
  category_id: null,
  sex: Genders.MALE,
  functions: [],
  is_active: true,
  created_at: null,
  updated_at: null,
};

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  categories: Category[];
  onSuccess: (data: Member) => Promise<void>;
  showPaymentsTab?: boolean;
}

export default function MemberModal({
  isOpen,
  onClose,
  member,
  categories,
  onSuccess,
  showPaymentsTab = true,
}: MemberModalProps) {
  const t = translations.members.modals;
  const isEditMode = member !== null;
  const [formData, setFormData] = useState<Member>(member ?? MEMBER_INITIAL_DATA);

  const title = isEditMode
    ? `${member.registration_number} - ${member.name} ${member.surname}`
    : t.addMember;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      onPress={() => onSuccess(formData)}
      size={isEditMode ? '4xl' : '2xl'}
      title={title}
      isFooterWithActions
    >
      {isEditMode && showPaymentsTab ? (
        <Tabs aria-label={t.tabsAriaLabel}>
          <Tab key="info" title={t.tabs.info}>
            <MemberInfoForm
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              isEditMode
            />
          </Tab>
          <Tab key="payments" title={t.tabs.membershipFees}>
            <MemberPaymentsTab member={member} />
          </Tab>
        </Tabs>
      ) : (
        <MemberInfoForm
          formData={formData}
          setFormData={setFormData}
          categories={categories}
          isEditMode={isEditMode}
        />
      )}
    </UnifiedModal>
  );
}
