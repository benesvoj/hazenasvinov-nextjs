'use client';

import {ReactNode} from 'react';

import {Alert} from '@heroui/alert';
import {Tab, Tabs} from '@heroui/tabs';

import {LoadingSpinner, VStack} from '@/components';

import {commonCopy} from '../../copy';

export interface TabConfig {
  key: string;
  title: ReactNode;
  content: ReactNode;

  actions?: ReactNode;
  filters?: ReactNode;

  inheritGlobalActions?: boolean;
  inheritGlobalFilters?: boolean;
}

export interface AppPageLayoutProps {
  header?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  floatingActions?: ReactNode;

  isLoading?: boolean;
  isError?: boolean;
  isUnderConstruction?: boolean;

  tabs?: TabConfig[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  tabsAriaLabel?: string;

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

  tabs,
  activeTab,
  onTabChange,
  tabsAriaLabel = 'Tabs',

  children,
}: AppPageLayoutProps) {
  if (isLoading) return <LoadingSpinner />;

  const effectiveActiveTab = activeTab || tabs?.[0]?.key;

  const renderTabContent = (tab: TabConfig) => {
    const tabActions = tab.inheritGlobalActions ? actions : (tab.actions ?? undefined);

    const tabFilters = tab.inheritGlobalFilters ? filters : (tab.filters ?? undefined);

    return (
      <VStack spacing={4}>
        {tabActions}
        {tabFilters}
        {tab.content}
      </VStack>
    );
  };

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

        {!tabs && (
          <>
            {actions && actions}
            {filters && filters}
            {children}
          </>
        )}

        {tabs && (
          <Tabs
            selectedKey={effectiveActiveTab}
            onSelectionChange={(key) => onTabChange?.(key as string)}
            aria-label={tabsAriaLabel}
          >
            {tabs.map((tab) => (
              <Tab key={tab.key} title={tab.title}>
                {renderTabContent(tab)}
              </Tab>
            ))}
          </Tabs>
        )}
      </VStack>

      {floatingActions}
    </>
  );
}
