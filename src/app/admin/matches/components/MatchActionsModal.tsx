'use client';

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { EyeIcon, PencilIcon, UserGroupIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Match } from '@/types';

interface MatchActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  onAddResult: () => void;
  onEditMatch: (match: Match) => void;
  onLineupModalOpen: () => void;
  onDeleteClick: (match: Match) => void;
  onMatchProcessOpen: () => void;
  isSeasonClosed: () => boolean;
}

const MatchActionsModal: React.FC<MatchActionsModalProps> = ({
  isOpen,
  onClose,
  match,
  onAddResult,
  onEditMatch,
  onLineupModalOpen,
  onDeleteClick,
  onMatchProcessOpen,
  isSeasonClosed
}) => {
  const handleAddResult = () => {
    onClose();
    onAddResult();
  };

  const handleEditMatch = () => {
    if (match) {
      onClose();
      onEditMatch(match);
    }
  };

  const handleLineupModalOpen = () => {
    onClose();
    onLineupModalOpen();
  };

  const handleDeleteClick = () => {
    if (match) {
      onClose();
      onDeleteClick(match);
    }
  };

  const handleMatchProcessOpen = () => {
    onClose();
    onMatchProcessOpen();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="sm"
      classNames={{
        base: "max-w-[95vw] mx-2",
        wrapper: "items-center justify-center p-2 sm:p-4",
        body: "px-4 py-4",
        header: "px-4 py-4",
        footer: "px-4 py-4"
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold">Akce pro zápas</h3>
          </div>
        </ModalHeader>
        <ModalBody className="px-4 py-4">
          <div className="space-y-2">
            {match?.status === 'upcoming' && (
              <Button
                color="primary"
                variant="light"
                size="lg"
                startContent={<EyeIcon className="w-4 h-4" />}
                onPress={handleAddResult}
                className="w-full justify-start h-auto py-3 px-4"
                isDisabled={isSeasonClosed()}
              >
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">Přidat výsledek</span>
                  <span className="text-xs text-gray-500 mt-1">Zadat výsledek zápasu</span>
                </div>
              </Button>
            )}
            
            <Button
              color="warning"
              variant="light"
              size="lg"
              startContent={<PencilIcon className="w-4 h-4" />}
              onPress={handleEditMatch}
              className="w-full justify-start h-auto py-3 px-4"
              isDisabled={isSeasonClosed()}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">Upravit zápas</span>
                <span className="text-xs text-gray-500 mt-1">Upravit informace o zápasu</span>
              </div>
            </Button>
            
            <Button
              color="secondary"
              variant="light"
              size="lg"
              startContent={<UserGroupIcon className="w-4 h-4" />}
              onPress={handleLineupModalOpen}
              className="w-full justify-start h-auto py-3 px-4"
              isDisabled={isSeasonClosed()}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">Správa sestav</span>
                <span className="text-xs text-gray-500 mt-1">Spravovat sestavy týmů</span>
              </div>
            </Button>
            
            <Button
              color="danger"
              variant="light"
              size="lg"
              startContent={<TrashIcon className="w-4 h-4" />}
              onPress={handleDeleteClick}
              className="w-full justify-start h-auto py-3 px-4"
              isDisabled={isSeasonClosed()}
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-left">
                  <span className="font-medium">Smazat zápas</span>
                  <span className="text-xs text-gray-500 mt-1 block">Trvale smazat zápas</span>
                </span>
              </div>
            </Button>
            
            <Button
              color="success"
              variant="light"
              size="lg"
              startContent={<DocumentIcon className="w-4 h-4" />}
              onPress={handleMatchProcessOpen}
              className="w-full justify-start h-auto py-3 px-4"
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">Kompletní proces</span>
                <span className="text-xs text-gray-500 mt-1">Výsledek, fotky, článek</span>
              </div>
            </Button>
          </div>
        </ModalBody>
        <ModalFooter className="px-4 py-4">
          <Button
            color="default"
            variant="light"
            onPress={onClose}
            className="w-full"
            size="lg"
          >
            Zavřít
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MatchActionsModal;
