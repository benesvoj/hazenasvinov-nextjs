'use client';

import React from 'react';

import {Chip, Input} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {Choice, GenderSelect} from '@/components';
import {Genders, getMemberFunctionOptions} from '@/enums';
import {Category, Member} from '@/types';

interface MemberInfoFormProps {
  formData: Member;
  setFormData: (data: Member) => void;
  categories: Category[];
  isEditMode?: boolean;
}

/** @deprecated Use MemberInfoFormWithHookForm instead, which uses react-hook-form and has better validation and performance */
export default function MemberInfoForm({
  formData,
  setFormData,
  categories,
  isEditMode = false,
}: MemberInfoFormProps) {
  const tMember = translations.members;

  const categoryItems = categories.map((c) => ({key: c.id, label: c.name}));

  return (
    <div className="space-y-2 md:space-y-4">
      <div className="w-full">
        <Input
          label={tMember.modals.memberForm.registrationNumber}
          placeholder={isEditMode ? '' : tMember.modals.memberForm.registrationNumberPlaceholder}
          value={formData.registration_number || ''}
          onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
          isRequired={isEditMode}
          size="sm"
          description={!isEditMode ? tMember.modals.memberForm.registrationNumberHelper : undefined}
          className={'md:w-1/2'}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <Input
          label={tMember.modals.memberForm.name}
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          isRequired
          size="sm"
        />
        <Input
          label={tMember.modals.memberForm.surname}
          value={formData.surname}
          onChange={(e) => setFormData({...formData, surname: e.target.value})}
          isRequired
          size="sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-4">
        <Input
          label={tMember.modals.memberForm.dateOfBirth}
          type="date"
          value={formData.date_of_birth || ''}
          onChange={(e) => setFormData({...formData, date_of_birth: e.target.value || null})}
          placeholder={tMember.modals.memberForm.dateOfBirthPlaceholder}
          size="sm"
        />
        <GenderSelect
          value={formData.sex || Genders.MALE}
          onChange={(value) => setFormData({...formData, sex: value, category_id: ''})}
        />
      </div>

      <div className="w-1/2">
        <Choice
          value={formData.category_id || null}
          onChange={(value) => setFormData({...formData, category_id: value ?? ''})}
          items={categoryItems}
          label={tMember.modals.memberForm.category}
          isRequired
          isDisabled={!formData.sex}
          size="sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {tMember.modals.memberForm.functions}
        </label>
        <div className="flex flex-wrap gap-2">
          {getMemberFunctionOptions().map(({value, label}) => (
            <Chip
              key={value}
              variant={formData.functions.includes(value) ? 'solid' : 'bordered'}
              color={formData.functions.includes(value) ? 'primary' : 'default'}
              onClose={
                formData.functions.includes(value)
                  ? () =>
                      setFormData({
                        ...formData,
                        functions: formData.functions.filter((f) => f !== value),
                      })
                  : undefined
              }
              className="cursor-pointer"
              onClick={() => {
                setFormData({
                  ...formData,
                  functions: formData.functions.includes(value)
                    ? formData.functions.filter((f) => f !== value)
                    : [...formData.functions, value],
                });
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
