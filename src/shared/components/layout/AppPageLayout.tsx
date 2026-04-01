'use client';

import {ReactNode} from 'react';

import {Alert} from '@heroui/react';

import {LoadingSpinner, VStack} from '@/components';

import {commonCopy} from '../../copy';

export interface AppPageLayoutProps {
  header?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  floatingActions?: ReactNode;

  isLoading?: boolean;
  isError?: boolean;
  isUnderConstruction?: boolean;

  children: ReactNode;
}

export function AppPageLayout({
  header,
  actions,
  filters,
  floatingActions,
  isLoading,
  isError,
  isUnderConstruction,
  children,
}: AppPageLayoutProps) {
  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <VStack spacing={4}>
        {isUnderConstruction && (
          <Alert
            color="warning"
            title={commonCopy.alerts.warning}
            description={commonCopy.alerts.underConstruction}
          />
        )}
        {isError && (
          <Alert
            color="danger"
            title={commonCopy.alerts.error}
            description={commonCopy.alerts.errorLoadingPage}
          />
        )}
        {header && header}
        {actions && actions}
        {filters && filters}
        {children}
      </VStack>

      {floatingActions}
    </>
  );
}
