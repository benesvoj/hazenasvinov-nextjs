'use client';

import {useMemo} from 'react';

import {Tab, Tabs} from '@heroui/tabs';

import {sharedTabsProps} from '@/components/ui/tabsStyles';

import {LoadingSpinner, VStack} from '@/components';
import {AdminContainerProps, TabConfig} from '@/types';
import {hasItems} from '@/utils';

import {AdminActions, AdminContent, AdminFilters, AdminHeader} from './';

export function AdminContainer<T extends readonly TabConfig[] = TabConfig[]>({
  children,
  title,
  description,
  icon,
  actions,
  filters,
  loading,
  tabs,
  activeTab,
  onTabChange,
  tabsAriaLabel = 'Admin Container Tabs',
}: AdminContainerProps<T>) {
  const effectiveActiveTab = activeTab || tabs?.[0]?.key || '';

  // Helper function to get actions for a specific tab
  const getTabActions = (tab: TabConfig) => {
    // Check if tab has inheritGlobalActions flag
    if ('inheritGlobalActions' in tab && tab.inheritGlobalActions) {
      return actions;
    }

    // Check for tab-specific actions
    if ('actions' in tab) {
      return tab.actions;
    }

    // Default: no actions
    return undefined;
  };

  // Helper function to get filters for a specific tab
  const getTabFilters = (tab: TabConfig) => {
    // Check if tab has inheritGlobalFilters flag
    if ('inheritGlobalFilters' in tab && tab.inheritGlobalFilters) {
      return filters;
    }

    // Check for tab-specific filters
    if ('filters' in tab) {
      return tab.filters;
    }

    // Default: no filters
    return undefined;
  };

  // For non-tab mode, use global actions/filters
  const displayActions = useMemo(() => {
    if (!tabs) return actions;
    return undefined;
  }, [tabs, actions]);

  const displayFilters = useMemo(() => {
    if (!tabs) return filters;
    return undefined;
  }, [tabs, filters]);

  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full space-y-4">
          {(title || description || icon) && (
            <AdminHeader title={title} description={description} icon={icon} />
          )}

          <AdminContent>
            {hasItems(tabs) ? (
              <Tabs
                {...sharedTabsProps}
                selectedKey={effectiveActiveTab}
                onSelectionChange={(key) => onTabChange?.(key as T[number]['key'])}
                aria-label={tabsAriaLabel}
              >
                {tabs.map((tab) => {
                  const tabActions = getTabActions(tab);
                  const tabFilters = getTabFilters(tab);

                  return (
                    <Tab key={tab.key} title={tab.title}>
                      <div className="flex flex-col gap-4">
                        {hasItems(tabActions) && <AdminActions actions={tabActions} />}
                        {tabFilters && <AdminFilters>{tabFilters}</AdminFilters>}
                        {tab.content}
                      </div>
                    </Tab>
                  );
                })}
              </Tabs>
            ) : (
              <>
                {(displayActions || displayFilters) && (
                  <div className="flex flex-col gap-4 mb-4">
                    {displayActions && displayActions.length > 0 && (
                      <AdminActions actions={displayActions} />
                    )}
                    {displayFilters && <AdminFilters>{displayFilters}</AdminFilters>}
                  </div>
                )}
                {children}
              </>
            )}
          </AdminContent>
        </div>
      )}
    </>
  );
}
