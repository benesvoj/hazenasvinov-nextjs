import {useMemo} from 'react';

import {Tab, Tabs} from '@heroui/react';

import {LoadingSpinner} from '@/components';
import {AdminContainerProps, TabConfig} from '@/types';

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

  const currentTab = useMemo(
    () => tabs?.find((tab) => tab.key === effectiveActiveTab) || tabs?.[0],
    [tabs, effectiveActiveTab]
  );

  // Determine which actions to display
  const displayActions = useMemo(() => {
    // No tabs mode: use global actions
    if (!tabs) {
      return actions;
    }

    // No current tab: show nothing
    if (!currentTab) {
      return undefined;
    }

    // Check if tab has inheritGlobalActions flag
    // TypeScript knows this could be from TabWithInheritedActions or TabWithMixedConfig
    if ('inheritGlobalActions' in currentTab && currentTab.inheritGlobalActions) {
      return actions;
    }

    // Check for tab-specific actions
    if ('actions' in currentTab) {
      return currentTab.actions;
    }

    // Default: no actions
    return undefined;
  }, [tabs, currentTab, actions]);

  // Determine which filters to display
  const displayFilters = useMemo(() => {
    // No tabs mode: use global filters
    if (!tabs) {
      return filters;
    }

    // No current tab: show nothing
    if (!currentTab) {
      return undefined;
    }

    // Check if tab has inheritGlobalFilters flag
    if ('inheritGlobalFilters' in currentTab && currentTab.inheritGlobalFilters) {
      return filters;
    }

    // Check for tab-specific filters
    if ('filters' in currentTab) {
      return currentTab.filters;
    }

    // Default: no filters
    return undefined;
  }, [tabs, currentTab, filters]);

  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full space-y-4">
          {(title || description || icon) && (
            <AdminHeader title={title} description={description} icon={icon} />
          )}

          {(displayActions || displayFilters) && (
            <div className="flex flex-col gap-4">
              {displayActions && displayActions.length > 0 && (
                <AdminActions actions={displayActions} />
              )}
              {displayFilters && <AdminFilters>{displayFilters}</AdminFilters>}
            </div>
          )}

          <AdminContent>
            {tabs && tabs.length > 0 ? (
              <Tabs
                selectedKey={effectiveActiveTab}
                onSelectionChange={(key) => onTabChange?.(key as T[number]['key'])}
                aria-label={tabsAriaLabel}
                className="w-full"
              >
                {tabs.map((tab) => (
                  <Tab key={tab.key} title={tab.title}>
                    {tab.content}
                  </Tab>
                ))}
              </Tabs>
            ) : (
              children
            )}
          </AdminContent>
        </div>
      )}
    </>
  );
}
