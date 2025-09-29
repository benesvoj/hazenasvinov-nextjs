import React from 'react';

import {Button} from '@heroui/button';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';

import {translations} from '@/lib/translations';

// TODO: Add showToas about success deletion

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: DeleteConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p>{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {translations.DeleteConfirmationModal.cancelButtonText}
          </Button>
          <Button color={'danger'} onPress={onConfirm}>
            {translations.DeleteConfirmationModal.confirmButtonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
