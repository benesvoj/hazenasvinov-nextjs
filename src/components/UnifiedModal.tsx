import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ModalProps,
  Button,
  ButtonGroup,
} from '@heroui/react';
import {Heading, HeadingLevel} from './Headings';
import {translations} from '@/lib/translations';

interface UnifiedModalProps extends Omit<ModalProps, 'isOpen' | 'onOpenChange'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  showCloseButton?: boolean;
  scrollBehavior?: 'inside' | 'outside';
  hSize?: HeadingLevel;
  actions?: React.ReactNode;
  isFooterWithActions?: boolean;
  isOnlyCloseButton?: boolean;
  onPress?: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
}

export default function UnifiedModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = '2xl',
  scrollBehavior = 'inside',
  hSize = 2,
  actions,
  isFooterWithActions = false,
  onPress,
  isDisabled,
  isLoading,
  isOnlyCloseButton = false,
  ...props
}: UnifiedModalProps) {
  const t = translations.button;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      scrollBehavior={scrollBehavior}
      backdrop="blur"
      classNames={{
        wrapper: 'items-center justify-center p-2 sm:p-4',
        body: 'max-h-[80vh] overflow-y-auto',
        header: 'pb-2',
        footer: 'pt-2',
      }}
      {...props}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 justify-between">
          <div className="flex flex-col gap-2">
            <Heading size={hSize}>{title}</Heading>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center justify-end">{actions}</div>}
        </ModalHeader>
        <ModalBody className="px-4 sm:px-6 py-4">{children}</ModalBody>

        {footer && <ModalFooter className="px-4 sm:px-6 py-4">{footer}</ModalFooter>}
        {isFooterWithActions && (
          <ModalFooter className="px-4 sm:px-6 py-4">
            {isOnlyCloseButton ? (
              <Button color="danger" variant="flat" onPress={onClose} aria-label={t.cancel}>
                {t.cancel}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="flat" onPress={onClose} aria-label={t.cancel}>
                  {t.cancel}
                </Button>
                <Button
                  color="primary"
                  onPress={onPress}
                  isDisabled={isDisabled}
                  aria-label={t.save}
                  isLoading={isLoading}
                >
                  {t.save}
                </Button>
              </div>
            )}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}

// Hook for managing modal state
export const useCustomModal = () => {
  const {isOpen, onOpen, onClose} = useDisclosure();

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle: () => (isOpen ? onClose() : onOpen()),
  };
};
