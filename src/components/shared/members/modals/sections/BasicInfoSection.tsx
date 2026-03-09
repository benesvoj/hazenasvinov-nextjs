import React from 'react';

import {Input} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Choice, ContentCard, GenderSelect} from '@/components';
import {Genders} from '@/enums';
import {Category, MemberMetadataFormData} from '@/types';

interface BasicInfoSection {
  handleInputChange: (field: keyof MemberMetadataFormData, value: string) => void;
  formData: {
    name: string;
    surname: string;
    registration_number: string;
    date_of_birth: string;
    sex: Genders.MALE | Genders.FEMALE;
    category_id: string;
  };
  categories: Category[];
}

export const BasicInfoSection = ({handleInputChange, formData, categories}: BasicInfoSection) => {
  const categoriesOptions = categories.map((category) => ({
    key: category.id,
    label: category.name,
  }));

  return (
    <ContentCard
      title={translations.members.labels.basicInfoSection.title}
      padding={'none'}
      titleSize={3}
      titleClassName="text-blue-700"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={translations.members.labels.basicInfoSection.name}
          value={formData.name}
          onValueChange={(value) => handleInputChange('name', value)}
          placeholder={translations.members.placeholders.basicInfoSection.name}
          isRequired
          size="sm"
        />
        <Input
          label={translations.members.labels.basicInfoSection.surname}
          value={formData.surname}
          onValueChange={(value) => handleInputChange('surname', value)}
          placeholder={translations.members.placeholders.basicInfoSection.surname}
          isRequired
          size="sm"
        />
        <Input
          label={translations.members.labels.basicInfoSection.registrationNumber}
          value={formData.registration_number}
          onValueChange={(value) => handleInputChange('registration_number', value)}
          description={translations.members.helpers.basicInfoSection.registrationNumber}
          size="sm"
        />
        <Input
          label={translations.members.labels.basicInfoSection.dateOfBirth}
          type="date"
          value={formData.date_of_birth ?? undefined}
          onValueChange={(value) => handleInputChange('date_of_birth', value)}
          isRequired
          size="sm"
        />
        <GenderSelect value={formData.sex} onChange={(value) => handleInputChange('sex', value)} />
        <Choice
          label={translations.categories.labels.category}
          items={categoriesOptions}
          value={formData.category_id}
          onChange={(value) => handleInputChange('category_id', value || '')}
          isRequired
        />
      </div>
    </ContentCard>
  );
};
