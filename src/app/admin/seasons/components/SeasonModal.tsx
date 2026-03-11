'use client';

import {Checkbox} from '@heroui/checkbox';
import {Input} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Dialog} from '@/components';
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
  const submitButtonLabel = isEditMode
    ? translations.common.actions.save
    : translations.common.actions.add;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      onSubmit={onSubmit}
      isLoading={loading}
      submitButtonLabel={submitButtonLabel}
    >
      <div className={'grid grid-cols-2 gap-4'}>
        <div className="col-span-2">
          <Input
            label={translations.seasons.labels.name}
            placeholder={translations.seasons.labels.namePlaceholder}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            isRequired
            size={'sm'}
          />
        </div>

        <Input
          label={translations.seasons.labels.startDate}
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
          isRequired
          size={'sm'}
        />

        <Input
          label={translations.seasons.labels.endDate}
          type="date"
          value={formData.end_date}
          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
          isRequired
          size={'sm'}
        />

        <Checkbox
          title={translations.seasons.labels.active}
          isSelected={formData.is_active === null ? false : formData.is_active}
          onValueChange={(value) => setFormData({...formData, is_active: value})}
          size={'sm'}
        >
          {translations.seasons.labels.active}
        </Checkbox>

        <Checkbox
          title={translations.seasons.labels.closed}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          isSelected={formData.is_closed === null ? false : formData.is_closed}
          onValueChange={(value) => setFormData({...formData, is_closed: value})}
          size={'sm'}
        >
          {translations.seasons.labels.closed}
        </Checkbox>
      </div>
    </Dialog>
  );
};
