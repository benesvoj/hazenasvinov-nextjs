import React from 'react';

import {Checkbox, Input, Select, SelectItem, Tabs, Tab} from '@heroui/react';

import {Heading, UnifiedModal} from '@/components';
import {AgeGroups, Genders, getAgeGroupsOptions, getGenderOptions, ModalMode} from '@/enums';
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
  const modalTitle = title || (mode === ModalMode.ADD ? 'Přidat kategorii' : 'Upravit kategorii');

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
        <Tab key="basic" title="Základní údaje">
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Input
                label="Název"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                isRequired
                placeholder="např. Muži, Ženy, Dorostenci"
              />
              <Input
                label="Popis"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Volitelný popis kategorie"
              />
              <Select
                label="Věková skupina"
                placeholder="Vyberte věkovou skupinu"
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
                label="Pohlaví"
                placeholder="Vyberte pohlaví"
                selectedKeys={formData.gender ? [formData.gender] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as Genders;
                  setFormData({...formData, gender: selectedKey});
                }}
                description="Smíšené týmy mohou být pouze pro mládežnické kategorie"
              >
                {getGenderOptions().map((option) => (
                  <SelectItem key={option.value}>{option.label}</SelectItem>
                ))}
              </Select>
              <Input
                label="Pořadí"
                type="number"
                value={formData.sort_order?.toString() || '0'}
                onChange={(e) =>
                  setFormData({...formData, sort_order: parseInt(e.target.value) || 0})
                }
                placeholder="0"
                description="Nižší číslo = vyšší priorita v seznamu"
              />
              <div className="flex items-center">
                <Checkbox
                  isSelected={formData.is_active}
                  onValueChange={(checked) => setFormData({...formData, is_active: checked})}
                >
                  Aktivní
                </Checkbox>
              </div>
            </div>
          </div>
        </Tab>

        {mode === ModalMode.EDIT && (
          <Tab key="seasons" title="Sezóny">
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
    </UnifiedModal>
  );
}
