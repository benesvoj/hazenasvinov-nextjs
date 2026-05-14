'use client';

import React from 'react';

import {ContentCard, HStack} from '@/components';

interface AdminFiltersProps {
  children: React.ReactNode;
}

export const AdminFilters = ({children}: AdminFiltersProps) => {
  return (
    <ContentCard fullWidth>
      <HStack spacing={2} wrap>
        {children}
      </HStack>
    </ContentCard>
  );
};
