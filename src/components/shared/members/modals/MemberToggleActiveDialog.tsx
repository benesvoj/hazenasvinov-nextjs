'use client';

import React from 'react';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {getMemberFullName} from '@/helpers';

/** Minimal shape needed to render the dialog — matches every member view type. */
interface ToggleActiveMember {
  name: string | null;
  surname: string | null;
  is_active: boolean | null;
}

interface MemberToggleActiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  /** Member being toggled; `null` while the dialog is closed. */
  member: ToggleActiveMember | null;
  isLoading: boolean;
}

/**
 * Confirmation dialog for the soft removal of a member.
 *
 * Wording flips based on the member's current state: an active member gets the
 * "vyřadit" copy (danger action), a deactivated one the "obnovit" copy.
 */
export const MemberToggleActiveDialog = ({
  isOpen,
  onClose,
  onSubmit,
  member,
  isLoading,
}: MemberToggleActiveDialogProps) => {
  const t = translations.members;
  const isActive = Boolean(member?.is_active);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={isActive ? t.modals.titles.deactivateMember : t.modals.titles.activateMember}
      subtitle={getMemberFullName(member) || undefined}
      submitButtonLabel={isActive ? t.table.actions.deactivate : t.table.actions.activate}
      dangerAction={isActive}
      isLoading={isLoading}
      size="md"
    >
      {isActive ? t.modals.deactivateMemberMessage : t.modals.activateMemberMessage}
    </Dialog>
  );
};
