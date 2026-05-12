import React from 'react';

import {Input, Textarea} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {ModalMode} from '@/enums';
import {CategoryLineupFormData} from '@/types';

interface LineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CategoryLineupFormData;
  setFormData: (data: CategoryLineupFormData) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  mode: ModalMode;
}

export const LineupModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  isLoading,
  mode,
}: LineupModalProps) => {
  const tAction = translations.common.actions;
  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode
    ? translations.lineups.titles.update
    : translations.lineups.titles.new;

  const submitButtonLabel = isEditMode ? tAction.save : tAction.add;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={modalTitle}
      isLoading={isLoading}
      isDisabled={!formData.name.trim()}
      submitButtonLabel={submitButtonLabel}
    >
      <Input
        label={translations.lineups.labels.name}
        placeholder={translations.lineups.placeholders.name}
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        isRequired
        size={'sm'}
      />

      <Textarea
        label={translations.lineups.labels.description}
        placeholder={translations.lineups.placeholders.description}
        value={formData?.description ?? ''}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        size={'sm'}
      />
    </Dialog>
  );
};
