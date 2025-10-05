import React from 'react';

import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';

import {Bars3Icon} from '@heroicons/react/24/outline';

import {MobileActionsMenuProps, ActionItem} from '@/types';

export default function MobileActionsMenu({
  actions,
  title = 'Dostupné akce',
  description = 'Vyberte akci, kterou chcete provést',
  triggerLabel = '',
  triggerIcon = <Bars3Icon className="w-5 h-5" />,
  triggerColor = 'primary',
  triggerVariant = 'light',
  triggerSize = 'sm',
  className = '',
  showCloseButton = true,
  closeOnAction = true,
  fullWidth = false,
  showOnDesktop = false,
}: MobileActionsMenuProps) {
  const {isOpen, onOpen, onClose} = useDisclosure();

  const handleActionClick = (action: ActionItem) => {
    if (!action.isDisabled) {
      action.onClick();
      if (closeOnAction) {
        onClose();
      }
    }
  };

  const shouldShow = showOnDesktop ? true : 'lg:hidden';

  return (
    <>
      {/* Trigger Button */}
      <Button
        color={triggerColor}
        variant={triggerVariant}
        size={triggerSize}
        onPress={onOpen}
        className={`${shouldShow} ${fullWidth ? 'w-full' : ''} ${className}`}
        startContent={triggerIcon}
      >
        {triggerLabel}
      </Button>

      {/* Actions Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="sm"
        classNames={{
          base: 'max-w-[95vw] mx-2',
          wrapper: 'items-center justify-center p-2 sm:p-4',
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="px-4 py-4">
            <div className="space-y-2">
              {actions.map((action) => (
                <Button
                  key={action.key}
                  color={action.color || 'default'}
                  variant={action.variant || 'light'}
                  size={action.size || 'md'}
                  onPress={() => handleActionClick(action)}
                  isDisabled={action.isDisabled}
                  className="w-full justify-start h-auto py-3 px-4"
                  startContent={action.icon}
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-medium">{action.label}</span>
                    {action.description && (
                      <span className="text-xs text-gray-500 mt-1">{action.description}</span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ModalBody>

          <ModalFooter className="px-4 py-4">
            <Button color="default" variant="light" onPress={onClose} className="w-full">
              Zavřít
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

// Hook for managing mobile actions menu state
export const useMobileActionsMenu = () => {
  const {isOpen, onOpen, onClose} = useDisclosure();

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle: () => (isOpen ? onClose() : onOpen()),
  };
};
