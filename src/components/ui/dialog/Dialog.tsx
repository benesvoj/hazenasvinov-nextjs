'use client';

import React, {ReactNode} from 'react';

import {Button} from '@heroui/button';
import {Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalProps} from '@heroui/modal';

import {translations} from '@/lib/translations';

import {Heading, Show} from '@/components';

type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

interface DialogProps extends Omit<ModalProps, 'isOpen' | 'onOpenChange'> {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
  children: ReactNode;
  size?: DialogSize;
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  submitButtonLabel?: string;
  scrollBehaviour?: 'inside' | 'outside';
  dangerAction?: boolean;
}

/**
 * Modal dialog built on HeroUI `Modal`.
 *
 * Renders a centered, blur-backdrop modal with a header (title + optional subtitle),
 * scrollable body, and an optional footer with Cancel / Submit buttons.
 *
 * @property isOpen - Controls modal visibility.
 * @property onClose - Called when the user dismisses the dialog (backdrop click, Esc, or Cancel button).
 * @property onSubmit - Submit handler. When provided, the footer with Cancel and Submit buttons is shown.
 * @property title - Modal heading text.
 * @property subtitle - Optional subtext rendered below the title.
 * @property size - Modal width (`'sm'`–`'5xl'` | `'full'`). Default `'2xl'`.
 * @property isLoading - Disables Cancel and shows a spinner on the Submit button.
 * @property isDisabled - Disables the Submit button (Cancel stays enabled).
 * @property submitButtonLabel - Custom label for the Submit button. Default `translations.common.actions.save`.
 * @property scrollBehavior - Scroll strategy for overflowing content (`'inside'` | `'outside'`). Default `'inside'`.
 * @property dangerAction - When `true`, the Submit button uses `color="danger"` instead of `"primary"`.
 * @property children - Dialog body content.
 */
export const Dialog = (props: DialogProps) => {
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      size={props.size || '2xl'}
      backdrop="blur"
      scrollBehavior={props.scrollBehavior || 'inside'}
      classNames={{
        ...props.classNames,
        base: `mx-2 ${props.classNames?.base ?? ''}`.trim(),
        wrapper: `items-center justify-center p-2 sm:p-4 ${props.classNames?.wrapper ?? ''}`.trim(),
      }}
    >
      <ModalContent>
        <ModalHeader className={'flex flex-col gap-2'}>
          <Heading size={2}>{props.title}</Heading>
          <Show when={props.subtitle}>
            <p className="text-sm font-light text-gray-500">{props.subtitle}</p>
          </Show>
        </ModalHeader>
        <ModalBody>{props.children}</ModalBody>
        <Show when={props.onSubmit}>
          <ModalFooter className={'flex items-center justify-end gap-4'}>
            <Button
              variant="light"
              color="danger"
              onPress={props.onClose}
              aria-label={translations.common.actions.cancel}
              isDisabled={props.isLoading}
              size={'sm'}
            >
              {translations.common.actions.cancel}
            </Button>
            <Button
              color={!props.dangerAction ? 'primary' : 'danger'}
              variant="solid"
              onPress={props.onSubmit}
              aria-label={props.submitButtonLabel ?? translations.common.actions.save}
              isDisabled={props.isLoading || props.isDisabled}
              isLoading={props.isLoading}
              size={'sm'}
            >
              {props.submitButtonLabel ?? translations.common.actions.save}
            </Button>
          </ModalFooter>
        </Show>
      </ModalContent>
    </Modal>
  );
};
