'use client';

import React from 'react';

import {Input} from '@heroui/input';

import {translations} from '@/lib/translations';

import {ContentCard} from '@/components';
import {MemberMetadataFormData} from '@/types';

interface ParentSectionProps {
  handleInputChange: (field: keyof MemberMetadataFormData, value: string) => void;
  formData: {
    parent_name: string;
    parent_phone: string;
    parent_email: string;
  };
}

export const ParentSection = ({handleInputChange, formData}: ParentSectionProps) => {
  return (
    <ContentCard
      padding={'none'}
      titleSize={3}
      titleClassName="text-purple-700"
      title={translations.members.labels.parentSection.title}
      className={'sm:h-full'}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={translations.members.labels.parentSection.parentName}
          value={formData.parent_name}
          onValueChange={(value) => handleInputChange('parent_name', value)}
          placeholder={translations.members.placeholders.parentSection.parentName}
          size="sm"
        />
        <Input
          label={translations.members.labels.parentSection.parentPhone}
          value={formData.parent_phone}
          onValueChange={(value) => handleInputChange('parent_phone', value)}
          placeholder={translations.members.placeholders.parentSection.parentPhone}
          size="sm"
        />
        <Input
          label={translations.members.labels.parentSection.parentEmail}
          type="email"
          value={formData.parent_email}
          onValueChange={(value) => handleInputChange('parent_email', value)}
          placeholder={translations.members.placeholders.parentSection.parentEmail}
          className="md:col-span-2"
          size="sm"
        />
      </div>
    </ContentCard>
  );
};
