import React from 'react';

import {Input} from '@heroui/input';

import {translations} from '@/lib/translations';

import {ContentCard, Grid, GridItem} from '@/components';
import {MemberMetadataFormData} from '@/types';

interface ContactSection {
  handleInputChange: (field: keyof MemberMetadataFormData, value: string) => void;
  formData: {
    phone: string;
    email: string;
    address: string;
  };
}

export const ContactSection = ({handleInputChange, formData}: ContactSection) => {
  return (
    <ContentCard
      title={translations.members.labels.contactSection.title}
      padding={'none'}
      titleSize={3}
      titleClassName="text-green-700"
      className={'sm:h-full'}
    >
      <Grid columns={2} gap={'md'}>
        <GridItem>
          <Input
            label={translations.members.labels.contactSection.phone}
            value={formData.phone}
            onValueChange={(value) => handleInputChange('phone', value)}
            placeholder={translations.members.placeholders.contactSection.phone}
            size="sm"
          />
        </GridItem>
        <GridItem>
          <Input
            label={translations.members.labels.contactSection.email}
            type="email"
            value={formData.email}
            onValueChange={(value) => handleInputChange('email', value)}
            placeholder={translations.members.placeholders.contactSection.email}
            size="sm"
          />
        </GridItem>
        <GridItem>
          <Input
            label={translations.members.labels.contactSection.address}
            value={formData.address}
            onValueChange={(value) => handleInputChange('address', value)}
            placeholder={translations.members.placeholders.contactSection.address}
            className="md:col-span-2"
            size="sm"
          />
        </GridItem>
      </Grid>
    </ContentCard>
  );
};
