'use client';

import React from 'react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalProps,
  Button,
} from '@heroui/react';

import {translations} from '@/lib';

import {Heading, HeadingLevel} from '../heading/Heading';

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
  const tAction = translations.action;

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
            <Button
              variant="flat"
              onPress={onClose}
              aria-label={tAction.cancel}
              isDisabled={isLoading}
            >
              {tAction.cancel}
            </Button>
            {!isOnlyCloseButton && (
              <Button
                color="primary"
                onPress={onPress}
                isDisabled={isDisabled || isLoading}
                aria-label={tAction.save}
                isLoading={isLoading}
              >
                {tAction.save}
              </Button>
            )}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
