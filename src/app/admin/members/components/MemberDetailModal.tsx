'use client';

import React from 'react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
  Tabs,
  Tab,
} from '@heroui/react';

import {Member} from '@/types';

import MemberInfoTab from './MemberInfoTab';
import MemberPaymentsTab from './MemberPaymentsTab';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export default function MemberDetailModal({isOpen, onClose, member}: MemberDetailModalProps) {
  if (!member) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">
              {member.name} {member.surname}
            </h2>
            <p className="text-sm text-gray-500">{member.registration_number}</p>
          </div>
        </ModalHeader>
        <ModalBody>
          <Tabs aria-label="Member details">
            <Tab key="info" title="Informace">
              <MemberInfoTab member={member} />
            </Tab>
            <Tab key="payments" title="Členské poplatky">
              <MemberPaymentsTab member={member} />
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zavřít
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
