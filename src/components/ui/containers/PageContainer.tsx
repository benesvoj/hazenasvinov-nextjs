'use client';

import React from 'react';

import {Alert} from '@heroui/react';

import {translations} from '@/lib/translations/index';

import {LoadingSpinner} from '@/components';

export interface PageContainerProps {
  children: React.ReactNode;
  isUnderConstruction?: boolean;
  isLoading?: boolean;
  isError?: boolean;
}

/**
 * Renders a page container component with optional alerts for under construction, loading, or error states.
 *
 * @param {Object} props - The properties for the PageContainer component.
 * @param {React.ReactNode} props.children - The child components to be rendered within the container.
 * @param {boolean} [props.isUnderConstruction=false] - Indicates if the page is under construction. Displays a warning alert when true.
 * @param {boolean} [props.isLoading=false] - Indicates if the page is loading. Displays a loading spinner when true.
 * @param {boolean} [props.isError=false] - Indicates if there is an error. Displays an error alert when true.
 * @return The rendered page container component.
 */
export default function PageContainer({
  children,
  isUnderConstruction = false,
  isLoading = false,
  isError = false,
}: PageContainerProps) {
  return (
    <div className="space-y-2 sm:space-y-6 w-full mt-4 sm:mt-20">
      {isUnderConstruction && (
        <Alert
          color="warning"
          title={translations.common.alerts.warning}
          description={translations.common.underConstruction}
        />
      )}
      {isLoading ? <LoadingSpinner /> : children}
      {!isLoading && isError && (
        <Alert
          color="danger"
          title={translations.common.alerts.error}
          description={translations.common.responseMessages.errorLoadingPage}
        />
      )}
    </div>
  );
}
