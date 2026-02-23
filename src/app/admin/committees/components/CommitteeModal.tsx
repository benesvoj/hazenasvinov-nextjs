import {Button, Checkbox, Input} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {UnifiedModal} from '@/components';
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

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={onClose} isDisabled={isLoading}>
            {translations.common.actions.cancel}
          </Button>
          <Button color="primary" onPress={onSubmit} isLoading={isLoading} isDisabled={isLoading}>
            {isEditMode ? translations.common.actions.save : translations.common.actions.add}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label={translations.committees.modal.code}
          value={formData.code}
          onChange={(e) => setFormData({...formData, code: e.target.value})}
          isRequired
          placeholder={translations.committees.modal.codePlaceholder}
          isDisabled={isEditMode}
          description={isEditMode ? 'Kód komise nelze změnit po vytvoření' : undefined}
        />
        <Input
          label={translations.committees.modal.name}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
          placeholder={translations.committees.modal.namePlaceholder}
        />
        <Input
          label={translations.committees.modal.description}
          value={formData?.description ?? ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder={translations.committees.modal.descriptionPlaceholder}
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
        />
        <Checkbox
          isSelected={formData.is_active ?? true}
          onValueChange={(checked) => setFormData({...formData, is_active: checked})}
        >
          {translations.committees.modal.active}
        </Checkbox>
      </div>
    </UnifiedModal>
  );
};
