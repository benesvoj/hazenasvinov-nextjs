'use client';

import React from 'react';

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
export function useModal(): ModalState {
  return useDisclosure();
}

// Function overloads for type-safe useModals with 2-5 arguments
export function useModals<K1 extends string, K2 extends string>(
  name1: K1,
  name2: K2
): {[K in K1 | K2]: ModalState};

export function useModals<K1 extends string, K2 extends string, K3 extends string>(
  name1: K1,
  name2: K2,
  name3: K3
): {[K in K1 | K2 | K3]: ModalState};

export function useModals<
  K1 extends string,
  K2 extends string,
  K3 extends string,
  K4 extends string,
>(name1: K1, name2: K2, name3: K3, name4: K4): {[K in K1 | K2 | K3 | K4]: ModalState};

export function useModals<
  K1 extends string,
  K2 extends string,
  K3 extends string,
  K4 extends string,
  K5 extends string,
>(
  name1: K1,
  name2: K2,
  name3: K3,
  name4: K4,
  name5: K5
): {[K in K1 | K2 | K3 | K4 | K5]: ModalState};

/**
 * Creates a typed record of modal states from modal names.
 * Supports 2-5 modals with full type inference.
 *
 * @example
 * ```typescript
 * // 2 modals
 * const modals = useModals('Edit', 'Delete');
 * modals.Edit.isOpen;    // boolean
 * modals.Edit.onOpen();  // open the modal
 * modals.Delete.onClose(); // close the modal
 *
 * // 3 modals
 * const modals = useModals('Add', 'Edit', 'Delete');
 *
 * // 4 modals
 * const modals = useModals('Add', 'Edit', 'Delete', 'Detail');
 *
 * // Use in JSX
 * <Modal isOpen={modals.Edit.isOpen} onClose={modals.Edit.onClose}>
 * <Button onPress={modals.Delete.onOpen}>Delete</Button>
 * ```
 *
 * @example
 * ```typescript
 * // Before (verbose):
 * const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose} = useDisclosure();
 * const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();
 *
 * // After (clean):
 * const modals = useModals('Edit', 'Delete');
 * // modals.Edit.isOpen, modals.Delete.onOpen, etc.
 * ```
 */
export function useModals(...names: string[]): Record<string, ModalState> {
  // Always call all 5 hooks to satisfy React's rules of hooks
  // (hooks must be called in the same order every render)
  const modal1 = useDisclosure();
  const modal2 = useDisclosure();
  const modal3 = useDisclosure();
  const modal4 = useDisclosure();
  const modal5 = useDisclosure();

  const allModals = [modal1, modal2, modal3, modal4, modal5];

  // Build result object with only the requested modals
  const result: Record<string, ModalState> = {};
  names.forEach((name, index) => {
    if (index < allModals.length) {
      result[name] = allModals[index];
    }
  });

  return result;
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
