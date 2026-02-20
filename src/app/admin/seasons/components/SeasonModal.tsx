import {Button, Checkbox, Input} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';
import {SeasonFormData} from '@/types';

interface SeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: SeasonFormData;
  setFormData: (data: SeasonFormData) => void;
  onSubmit: () => void;
  mode: ModalMode;
  loading?: boolean;
}

export const SeasonModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  mode,
  loading,
}: SeasonModalProps) => {
  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode
    ? translations.seasons.modal.editSeasonTitle
    : translations.seasons.modal.addSeasonTitle;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={onClose} isDisabled={loading}>
            {translations.common.actions.cancel}
          </Button>
          <Button color="primary" onPress={onSubmit} isLoading={loading} isDisabled={loading}>
            {isEditMode ? translations.common.actions.save : translations.common.actions.add}
          </Button>
        </div>
      }
      classNames={{
        body: 'grid grid-cols-2 gap-4',
      }}
    >
      <div className="col-span-2">
        <Input
          label={translations.seasons.labels.name}
          placeholder={translations.seasons.labels.namePlaceholder}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
        />
      </div>

      <Input
        label={translations.seasons.labels.startDate}
        type="date"
        value={formData.start_date}
        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
        isRequired
      />

      <Input
        label={translations.seasons.labels.endDate}
        type="date"
        value={formData.end_date}
        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
        isRequired
      />

      <Checkbox
        title={translations.seasons.labels.active}
        isSelected={formData.is_active === null ? false : formData.is_active}
        onValueChange={(value) => setFormData({...formData, is_active: value})}
      >
        {translations.seasons.labels.active}
      </Checkbox>

      <Checkbox
        title={translations.seasons.labels.closed}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        isSelected={formData.is_closed === null ? false : formData.is_closed}
        onValueChange={(value) => setFormData({...formData, is_closed: value})}
      >
        {translations.seasons.labels.closed}
      </Checkbox>
    </UnifiedModal>
  );
};
