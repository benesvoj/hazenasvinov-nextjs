import React from 'react';

import {Checkbox, Input, Tab, Tabs} from '@heroui/react';

import {translations} from '@/lib/translations';

import {Choice, Dialog} from '@/components';
import {AgeGroups, Genders, getAgeGroupsOptions, getGenderOptions, ModalMode} from '@/enums';
import {CategoryFormData} from '@/types';

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  mode: ModalMode;
  isLoading?: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  mode,
  isLoading,
}: CategoryModalProps) {
  const t = translations.categories;
  const modalTitle =
    mode === ModalMode.ADD
      ? translations.categories.actions.add
      : translations.categories.actions.edit;

  const ageGroupOptions = getAgeGroupsOptions().map((option) => ({
    key: option.value,
    label: option.label,
  }));
  const genderOptions = getGenderOptions().map((option) => ({
    key: option.value,
    label: option.label,
  }));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="3xl"
      onSubmit={onSubmit}
      isLoading={isLoading}
    >
      <Tabs aria-label="Category modal tabs" className="w-full">
        <Tab key="basic" title={t.modal.basicInfoTab}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Input
              label={t.modal.input.name}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              isRequired
              placeholder={t.modal.input.namePlaceholder}
              size="sm"
            />

            <Input
              label={t.modal.input.description}
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={t.modal.input.descriptionPlaceholder}
              size="sm"
            />

            <Choice
              items={ageGroupOptions}
              value={formData.age_group}
              onChange={(value) => setFormData({...formData, age_group: value as AgeGroups})}
              label={t.modal.input.ageGroup}
              placeholder={t.modal.input.ageGroupPlaceholder}
            />

            <Choice
              items={genderOptions}
              value={formData.gender}
              onChange={(value) => setFormData({...formData, gender: value as Genders})}
              label={t.modal.input.gender}
              placeholder={t.modal.input.genderPlaceholder}
            />

            <Input
              label={t.modal.input.sortOrder}
              type="number"
              value={formData.sort_order?.toString() || '0'}
              onChange={(e) =>
                setFormData({...formData, sort_order: parseInt(e.target.value) || 0})
              }
              placeholder="0"
              description={t.modal.input.sortOrderDescription}
              size="sm"
            />

            <div className="flex items-center">
              <Checkbox
                isSelected={formData.is_active ?? true}
                onValueChange={(checked) => setFormData({...formData, is_active: checked})}
                size="sm"
              >
                {t.modal.input.isActive}
              </Checkbox>
            </div>
          </div>
        </Tab>

        {mode === ModalMode.EDIT && (
          <Tab key="seasons" title={t.modal.seasonTab}>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Zde můžete spravovat sezóny pro tuto kategorii. Každá kategorie může být použita v
                  několika sezónách s různými nastaveními.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Funkce pro správu sezón bude implementována v další verzi.
                </p>
              </div>
            </div>
          </Tab>
        )}
      </Tabs>
    </Dialog>
  );
}
