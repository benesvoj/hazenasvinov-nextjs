'use client';

import React from 'react';

import {Button} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {translations} from '@/lib';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const footer = () => {
    const t = translations.DeleteConfirmationModal;
    return (
      <>
        <Button
          variant="light"
          onPress={onClose}
          disabled={isLoading}
          aria-label={t.cancelButtonText}
        >
          {t.cancelButtonText}
        </Button>
        <Button
          color="danger"
          onPress={onConfirm}
          isLoading={isLoading}
          disabled={isLoading}
          aria-label={t.confirmButtonText}
        >
          {t.confirmButtonText}
        </Button>
      </>
    );
  };

  return (
    <UnifiedModal isOpen={isOpen} onClose={onClose} title={title} footer={footer()} size={'sm'}>
      <p>{message}</p>
    </UnifiedModal>
  );
}
