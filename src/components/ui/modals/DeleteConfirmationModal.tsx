'use client';

import React from 'react';

import {Button} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedModal} from '@/components';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

/**
 *  @Deprecated - use DialogDelete component instead, this component will be removed in future versions
 */
export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const footer = () => {
    return (
      <>
        <Button
          variant="light"
          onPress={onClose}
          disabled={isLoading}
          aria-label={translations.common.actions.cancel}
        >
          {translations.common.actions.cancel}
        </Button>
        <Button
          color="danger"
          onPress={onConfirm}
          isLoading={isLoading}
          disabled={isLoading}
          aria-label={translations.common.actions.confirm}
        >
          {translations.common.actions.confirm}
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
