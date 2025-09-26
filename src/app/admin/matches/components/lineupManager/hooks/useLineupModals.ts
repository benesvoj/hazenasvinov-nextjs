import {useState} from 'react';
import {useDisclosure} from '@heroui/react';

interface UseLineupModalsReturn {
  // Player modals
  isPlayerSelectionModalOpen: boolean;
  onPlayerSelectionModalOpen: () => void;
  onPlayerSelectionModalClose: () => void;
  isPlayerEditModalOpen: boolean;
  setIsPlayerEditModalOpen: (open: boolean) => void;

  // Coach modals
  isCoachSelectionModalOpen: boolean;
  setIsCoachSelectionModalOpen: (open: boolean) => void;
  isCoachEditModalOpen: boolean;
  setIsCoachEditModalOpen: (open: boolean) => void;

  // Delete modals
  isDeleteModalOpen: boolean;
  onDeleteModalOpen: () => void;
  onDeleteModalClose: () => void;
  isDeletePlayerModalOpen: boolean;
  onDeletePlayerModalOpen: () => void;
  onDeletePlayerModalClose: () => void;
}

export function useLineupModals(): UseLineupModalsReturn {
  // Player selection modal
  const {
    isOpen: isPlayerSelectionModalOpen,
    onOpen: onPlayerSelectionModalOpen,
    onClose: onPlayerSelectionModalClose,
  } = useDisclosure();

  // Player edit modal
  const [isPlayerEditModalOpen, setIsPlayerEditModalOpen] = useState(false);

  // Coach selection modal
  const [isCoachSelectionModalOpen, setIsCoachSelectionModalOpen] = useState(false);

  // Coach edit modal
  const [isCoachEditModalOpen, setIsCoachEditModalOpen] = useState(false);

  // Delete lineup modal
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  // Delete player modal
  const {
    isOpen: isDeletePlayerModalOpen,
    onOpen: onDeletePlayerModalOpen,
    onClose: onDeletePlayerModalClose,
  } = useDisclosure();

  return {
    // Player modals
    isPlayerSelectionModalOpen,
    onPlayerSelectionModalOpen,
    onPlayerSelectionModalClose,
    isPlayerEditModalOpen,
    setIsPlayerEditModalOpen,

    // Coach modals
    isCoachSelectionModalOpen,
    setIsCoachSelectionModalOpen,
    isCoachEditModalOpen,
    setIsCoachEditModalOpen,

    // Delete modals
    isDeleteModalOpen,
    onDeleteModalOpen,
    onDeleteModalClose,
    isDeletePlayerModalOpen,
    onDeletePlayerModalOpen,
    onDeletePlayerModalClose,
  };
}
