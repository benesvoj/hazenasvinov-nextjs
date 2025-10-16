import React from 'react';

import {Checkbox, Input, Select, SelectItem, Tabs, Tab} from '@heroui/react';

import CategoryFeeQuickView from '@/app/admin/categories/components/CategoryFeeQuickView';

import {Heading, UnifiedModal} from '@/components';
import {AgeGroups, Genders, getAgeGroupsOptions, getGenderOptions, ModalMode} from '@/enums';
import {translations} from '@/lib';
import {Category} from '@/types';

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: Category;
  setFormData: (data: Category) => void;
  mode: ModalMode;
  title?: string;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  mode,
  title,
}: CategoryModalProps) {
  const t = translations.categories;
  const modalTitle = title || (mode === ModalMode.ADD ? t.addCategory : t.editCategory);

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="3xl"
      onPress={onSubmit}
      isFooterWithActions
    >
      <Tabs aria-label="Category modal tabs" className="w-full">
        <Tab key="basic" title={t.modal.basicInfoTab}>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                label={t.modal.input.name}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                isRequired
                placeholder={t.modal.input.namePlaceholder}
              />
              <Input
                label={t.modal.input.description}
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder={t.modal.input.descriptionPlaceholder}
              />
              <Select
                label={t.modal.input.ageGroup}
                placeholder={t.modal.input.ageGroupPlaceholder}
                selectedKeys={formData.age_group ? [formData.age_group] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as AgeGroups;
                  setFormData({...formData, age_group: selectedKey});
                }}
              >
                {getAgeGroupsOptions().map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
              <Select
                label={t.modal.input.gender}
                placeholder={t.modal.input.genderPlaceholder}
                selectedKeys={formData.gender ? [formData.gender] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as Genders;
                  setFormData({...formData, gender: selectedKey});
                }}
                description={t.modal.input.genderDescription}
              >
                {getGenderOptions().map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
              <Input
                label={t.modal.input.sortOrder}
                type="number"
                value={formData.sort_order?.toString() || '0'}
                onChange={(e) =>
                  setFormData({...formData, sort_order: parseInt(e.target.value) || 0})
                }
                placeholder="0"
                description={t.modal.input.sortOrderDescription}
              />
              <div className="flex items-center">
                <Checkbox
                  isSelected={formData.is_active}
                  onValueChange={(checked) => setFormData({...formData, is_active: checked})}
                >
                  {t.modal.input.isActive}
                </Checkbox>
              </div>
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
        {mode === ModalMode.EDIT && (
          <Tab key="membershipFees" title={t.modal.membershipFeesTab}>
            <CategoryFeeQuickView categoryId={formData.id} />
          </Tab>
        )}
      </Tabs>
    </UnifiedModal>
  );
}
