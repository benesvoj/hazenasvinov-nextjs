'use client';

import {useDisclosure} from '@heroui/react';

/**
 *  Hook for managing modal state
 */
export const useCustomModal = () => {
  const {isOpen, onOpen, onClose} = useDisclosure();

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle: () => (isOpen ? onClose() : onOpen()),
  };
};
