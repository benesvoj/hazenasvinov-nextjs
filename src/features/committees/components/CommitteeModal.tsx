'use client';

import {Checkbox} from '@heroui/checkbox';
import {Input} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
import {ModalMode} from '@/enums';
import {CommitteeFormData} from '@/types';

interface CommitteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CommitteeFormData;
  setFormData: (data: CommitteeFormData) => void;
  onSubmit: () => void;
  isLoading: boolean;
  mode: ModalMode;
}

export const CommitteeModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  mode,
  isLoading,
}: CommitteeModalProps) => {
  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode
    ? translations.committees.modal.titleEdit
    : translations.committees.modal.titleAdd;
  const submitButtonLabel = isEditMode
    ? translations.common.actions.save
    : translations.common.actions.add;
  const helperText = isEditMode ? translations.committees.helpers.code : undefined;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      onSubmit={onSubmit}
      submitButtonLabel={submitButtonLabel}
      isLoading={isLoading}
      size={'md'}
    >
      <Input
        label={translations.committees.modal.code}
        value={formData.code}
        onChange={(e) => setFormData({...formData, code: e.target.value})}
        isRequired
        placeholder={translations.committees.modal.codePlaceholder}
        isDisabled={isEditMode}
        description={helperText}
        size={'sm'}
      />
      <Input
        label={translations.committees.modal.name}
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        isRequired
        placeholder={translations.committees.modal.namePlaceholder}
        size={'sm'}
      />
      <Input
        label={translations.committees.modal.description}
        value={formData?.description ?? ''}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        placeholder={translations.committees.modal.descriptionPlaceholder}
        size={'sm'}
      />
      <Input
        label={translations.committees.modal.sortOrder}
        type="number"
        value={formData.sort_order?.toString()}
        onChange={(e) =>
          setFormData({
            ...formData,
            sort_order: parseInt(e.target.value) || 0,
          })
        }
        placeholder="0"
        size={'sm'}
      />
      <Checkbox
        isSelected={formData.is_active ?? true}
        onValueChange={(checked) => setFormData({...formData, is_active: checked})}
        size={'sm'}
      >
        {translations.committees.modal.active}
      </Checkbox>
    </Dialog>
  );
};
