'use client';

import React from 'react';

import {Button} from '@heroui/button';
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from '@heroui/modal';

import {BlogPost} from '@/types';

interface DeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  post: BlogPost | null;
}

export default function DeletePostModal({isOpen, onClose, onConfirm, post}: DeletePostModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Smazat článek</ModalHeader>
        <ModalBody>
          <p>
            Opravdu chcete smazat článek <strong>&ldquo;{post?.title}&rdquo;</strong>?
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Tato akce je nevratná.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="danger" onPress={handleConfirm}>
            Smazat
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
