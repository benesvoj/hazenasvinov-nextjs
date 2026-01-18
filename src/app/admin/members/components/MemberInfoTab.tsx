import React from 'react';

import {Chip, Input, Select, SelectItem} from '@heroui/react';

import {Genders, getMemberFunctionOptions, ModalMode} from '@/enums';
import {translations} from '@/lib';
import {BaseMember, Category} from '@/types';
import {genderOptions} from '@/utils';

interface MemberInfoTabProps {
  formData: BaseMember | null;
  setFormData: (data: BaseMember) => void;
  categories: Category[];
  mode?: ModalMode;
}

export default function MemberInfoTab({
  formData,
  setFormData,
  categories,
  mode,
}: MemberInfoTabProps) {
  const isEditMode = mode === ModalMode.EDIT;

  const tMember = translations.members;

  const genderOpts = genderOptions();

  if (!formData) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={
            isEditMode
              ? tMember.modals.memberForm.registrationNumber
              : tMember.modals.memberForm.registrationNumberHelper
          }
          placeholder={isEditMode ? '' : tMember.modals.memberForm.registrationNumberPlaceholder}
          value={formData.registration_number || ''}
          onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
          isRequired={isEditMode}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={tMember.modals.memberForm.name}
          value={formData.name || ''}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
        />
        <Input
          label={tMember.modals.memberForm.surname}
          value={formData.surname || ''}
          onChange={(e) => setFormData({...formData, surname: e.target.value})}
          isRequired
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={tMember.modals.memberForm.dateOfBirth}
          type="date"
          value={formData.date_of_birth || ''}
          onChange={(e) => setFormData({...formData, date_of_birth: e.target.value || null})}
          placeholder={tMember.modals.memberForm.dateOfBirthPlaceholder}
        />
        <Select
          label={tMember.modals.memberForm.sex}
          selectedKeys={[formData.sex || Genders.MALE]}
          onSelectionChange={(keys) =>
            setFormData({
              ...formData,
              sex: Array.from(keys)[0] as Genders,
              category_id: '', // Clear category when sex changes
            })
          }
          isRequired
        >
          {Object.entries(genderOpts).map(([key, value]) => (
            <SelectItem key={key}>{value}</SelectItem>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label={tMember.modals.memberForm.category}
          selectedKeys={formData?.category_id ? [formData?.category_id] : []}
          onSelectionChange={(keys) =>
            setFormData({
              ...formData,
              category_id: Array.from(keys)[0] as string,
            })
          }
          isRequired
          isDisabled={!formData?.sex}
        >
          {categories
            .filter((category) => {
              // Filter category based on sex using the gender field from database
              if (formData?.sex === Genders.MALE) {
                // For male sex, show male and mixed category
                return category.gender === Genders.MALE || category.gender === Genders.MIXED;
              } else if (formData?.sex === Genders.FEMALE) {
                // For female sex, show female and mixed category
                return category.gender === Genders.FEMALE || category.gender === Genders.MIXED;
              }
              return false;
            })
            .map((category) => (
              <SelectItem key={category.id}>{category.name}</SelectItem>
            ))}
        </Select>
        {!formData?.sex && (
          <p className="text-sm text-gray-500 mt-1">{tMember.modals.memberForm.categoryHelper}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {tMember.modals.memberForm.functions}
        </label>
        <div className="flex flex-wrap gap-2">
          {getMemberFunctionOptions().map(({value, label}) => (
            <Chip
              key={value}
              variant={formData.functions?.includes(value) ? 'solid' : 'bordered'}
              color={formData.functions?.includes(value) ? 'primary' : 'default'}
              onClose={
                formData.functions?.includes(value)
                  ? () => {
                      setFormData({
                        ...formData,
                        functions: formData.functions?.filter((f) => f !== value) || [],
                      });
                    }
                  : undefined
              }
              className="cursor-pointer"
              onClick={() => {
                if (formData.functions?.includes(value)) {
                  setFormData({
                    ...formData,
                    functions: formData.functions?.filter((f) => f !== value),
                  });
                } else {
                  setFormData({
                    ...formData,
                    functions: [...(formData.functions || []), value],
                  });
                }
              }}
            >
              {label}
            </Chip>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">{tMember.modals.memberForm.functionsHelper}</p>
      </div>
    </div>
  );
}
