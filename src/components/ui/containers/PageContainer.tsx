'use client';

import React from 'react';

import {Alert} from '@heroui/react';

import {translations} from '@/lib/translations/index';

export interface PageContainerProps {
  children: React.ReactNode;
  isUnderConstruction?: boolean;
}

export default function PageContainer({children, isUnderConstruction = false}: PageContainerProps) {
  return (
    <div className="space-y-2 sm:space-y-6 w-full mt-4 sm:mt-20">
      {isUnderConstruction && (
        <Alert
          color="warning"
          title={translations.common.alerts.warning}
          description={translations.common.underConstruction}
        />
      )}
      {children}
    </div>
  );
}
