import React from 'react';

import {Checkbox, Input, Select, SelectItem} from '@heroui/react';

import {Heading, UnifiedModal} from '@/components';
import {AgeGroups, Genders, getAgeGroupsOptions, getGenderOptions} from '@/enums';
import {AddCategoryModalProps} from '@/types';

export default function AddCategoryModal({
  isOpen,
  onClose,
  onAddCategory,
  formData,
  setFormData,
}: AddCategoryModalProps) {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Přidat kategorii"
      size="3xl"
      onPress={onAddCategory}
      isFooterWithActions
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Information */}
        <div className="space-y-4">
          <Heading size={4}>Základní údaje</Heading>
          <Input
            label="Název"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            isRequired
            placeholder="např. Muži, Ženy, Dorostenci"
          />
          <Input
            label="Popis"
            value={formData.description}
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
          >
            {getGenderOptions().map((option) => (
              <SelectItem key={option.value}>{option.label}</SelectItem>
            ))}
          </Select>
          <Input
            label="Pořadí"
            type="number"
            value={formData.sort_order?.toString() || '0'}
            onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
            placeholder="0"
          />
          <Checkbox
            isSelected={formData.is_active}
            onValueChange={(checked) => setFormData({...formData, is_active: checked})}
          >
            Aktivní
          </Checkbox>
        </div>

        {/* Right Column - Competition Settings */}
        <div className="space-y-4">
          <Heading size={4}>Nastavení soutěže</Heading>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Funkce pro správu sezón bude implementována v další verzi.
            </p>
          </div>
        </div>
      </div>
    </UnifiedModal>
  );
}
