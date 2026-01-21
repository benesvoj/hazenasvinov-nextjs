'use client';

import React, {useMemo, useState} from 'react';

import {useDisclosure} from '@heroui/react';

/**
 * Modal state returned by useDisclosure
 */
export interface ModalState {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Extended modal state with toggle functionality
 */
export interface ModalStateWithToggle extends ModalState {
  onToggle: () => void;
}

/**
 * Simple alias for useDisclosure - for single modal cases.
 * Use this when you only have one modal in a component.
 *
 * @example
 * ```typescript
 * const modal = useModal();
 *
 * <Button onPress={modal.onOpen}>Open</Button>
 * <Modal isOpen={modal.isOpen} onClose={modal.onClose}>...</Modal>
 * ```
 */
export function useModal(): ModalStateWithToggle {
  const disclosure = useDisclosure();
  return {
    ...disclosure,
    onToggle: () => (disclosure.isOpen ? disclosure.onClose() : disclosure.onOpen()),
  };
}

/**
 * Creates a typed record of modal states from modal names.
 * Supports unlimited number of modals with full type inference.
 *
 * @example
 * ```typescript
 * const modals = useModalsNew('Add', 'Edit', 'Delete', 'Detail', 'Confirm', 'Settings');
 * modals.Edit.isOpen;     // boolean
 * modals.Edit.onOpen();   // open the modal
 * modals.Edit.onToggle(); // toggle the modal
 * ```
 */
export function useModals<T extends string>(...names: T[]): Record<T, ModalStateWithToggle> {
  const [openState, setOpenState] = useState<Record<string, boolean>>({});

  // Memoize the names key to avoid unnecessary recalculations
  const namesKey = names.join(',');

  return useMemo(() => {
    const result = {} as Record<T, ModalStateWithToggle>;

    for (const name of names) {
      result[name] = {
        isOpen: openState[name] ?? false,
        onOpen: () => setOpenState((s) => ({...s, [name]: true})),
        onClose: () => setOpenState((s) => ({...s, [name]: false})),
        onOpenChange: (open: boolean) => setOpenState((s) => ({...s, [name]: open})),
        onToggle: () => setOpenState((s) => ({...s, [name]: !s[name]})),
      };
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openState, namesKey]);
}

/**
 * Extended modal state with selected item tracking.
 * Useful for Edit/Delete modals that operate on a specific item.
 */
export interface ModalStateWithItem<T> extends ModalState {
  selectedItem: T | null;
  /** Open modal with a specific item (Edit/Delete mode) */
  openWith: (item: T) => void;
  /** Open modal without item (Add mode) - selectedItem will be null */
  openEmpty: () => void;
  /** Close modal and clear selected item */
  closeAndClear: () => void;
  /** Check if in edit mode (has selected item) */
  isEditMode: boolean;
}

/**
 * Creates a modal state that tracks a selected item.
 * Perfect for Add/Edit/Delete modals that may operate on a specific record.
 *
 * @template T - Type of the selected item
 * @returns Modal state with item tracking
 *
 * @example
 * ```typescript
 * // For Delete modal (always needs an item)
 * const deleteModal = useModalWithItem<Team>();
 * <Button onPress={() => deleteModal.openWith(team)}>Delete</Button>
 *
 * // For Add/Edit modal (item optional)
 * const formModal = useModalWithItem<Team>();
 * <Button onPress={formModal.openEmpty}>Add New</Button>
 * <Button onPress={() => formModal.openWith(team)}>Edit</Button>
 *
 * // Detect mode in modal
 * const title = formModal.isEditMode ? 'Edit Team' : 'Add Team';
 *
 * // Access selected item
 * <Modal isOpen={formModal.isOpen} onClose={formModal.closeAndClear}>
 *   {formModal.isEditMode && <p>Editing: {formModal.selectedItem?.name}</p>}
 * </Modal>
 * ```
 */
export function useModalWithItem<T>(): ModalStateWithItem<T> {
  const disclosure = useDisclosure();
  const [selectedItem, setSelectedItem] = React.useState<T | null>(null);

  const openWith = React.useCallback(
    (item: T) => {
      setSelectedItem(item);
      disclosure.onOpen();
    },
    [disclosure]
  );

  const openEmpty = React.useCallback(() => {
    setSelectedItem(null);
    disclosure.onOpen();
  }, [disclosure]);

  const closeAndClear = React.useCallback(() => {
    disclosure.onClose();
    setSelectedItem(null);
  }, [disclosure]);

  return {
    ...disclosure,
    selectedItem,
    openWith,
    openEmpty,
    closeAndClear,
    isEditMode: selectedItem !== null,
  };
}
