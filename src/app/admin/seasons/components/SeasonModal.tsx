import {Button, Checkbox, Input} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedModal} from '@/components';
import {ModalMode} from '@/enums';

interface SeasonFormData {
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_closed: boolean;
}

interface SeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: SeasonFormData;
  setFormData: (data: SeasonFormData) => void;
  onSubmit: () => void;
  mode: ModalMode;
}

export const SeasonModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  mode,
}: SeasonModalProps) => {
  const t = translations.season;
  const tButton = translations.button;
  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? t.editSeason : t.addSeason;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={onClose}>
            {tButton.cancel}
          </Button>
          <Button color="primary" onPress={onSubmit}>
            {isEditMode ? tButton.save : tButton.add}
          </Button>
        </div>
      }
      classNames={{
        body: 'grid grid-cols-2 gap-4',
      }}
    >
      <div className="col-span-2">
        <Input
          label={t.input.name}
          placeholder={t.input.namePlaceholder}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
        />
      </div>

      <Input
        label={t.input.startDate}
        type="date"
        value={formData.start_date}
        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
        isRequired
      />

      <Input
        label={t.input.endDate}
        type="date"
        value={formData.end_date}
        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
        isRequired
      />

      <Checkbox
        title={t.active}
        checked={formData.is_active}
        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
      >
        {t.active}
      </Checkbox>

      <Checkbox
        title={t.closed}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={formData.is_closed}
        onChange={(e) => setFormData({...formData, is_closed: e.target.checked})}
      >
        {t.closed}
      </Checkbox>
    </UnifiedModal>
  );
};
