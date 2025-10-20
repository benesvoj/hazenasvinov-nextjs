'use client';

import React from 'react';

import {Tab, Tabs} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {BaseMember, Member} from '@/types';

import MemberInfoTab from './MemberInfoTab';
import MemberPaymentsTab from './MemberPaymentsTab';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: BaseMember | null;
}

export default function MemberDetailModal({isOpen, onClose, member}: MemberDetailModalProps) {
  if (!member) {
    return null;
  }

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      size={'4xl'}
      title={`${member.registration_number} - ${member.name} ${member.surname}`}
    >
      <Tabs aria-label="Member details">
        <Tab key="info" title="Informace">
          <MemberInfoTab member={member} />
        </Tab>
        <Tab key="payments" title="Členské poplatky">
          <MemberPaymentsTab member={member} />
        </Tab>
      </Tabs>
    </UnifiedModal>
  );
}
