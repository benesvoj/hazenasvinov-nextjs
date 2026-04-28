'use client';

import {ReactNode} from 'react';

import {Alert} from '@heroui/alert';
import {Tab, Tabs} from '@heroui/tabs';

import {LoadingSpinner, VStack} from '@/components';

import {commonCopy} from '../../copy';

export interface TabConfig<T extends string = string> {
	key: T;
	title: ReactNode;
	content: ReactNode;

	actions?: ReactNode;
	filters?: ReactNode;
	floatingActions?: ReactNode;

	inheritGlobalActions?: boolean;
	inheritGlobalFilters?: boolean;
}

export interface AppPageLayoutProps<T extends string = string> {
	header?: ReactNode;
	actions?: ReactNode;
	filters?: ReactNode;
	floatingActions?: ReactNode;

	isLoading?: boolean;
	isError?: boolean;
	isUnderConstruction?: boolean;

	tabs?: TabConfig<T>[];
	activeTab?: T;
	onTabChange?: (key: T) => void;
	tabsAriaLabel?: string;

	children?: ReactNode;
}

export function AppPageLayout<T extends string = string>({
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
														 }: AppPageLayoutProps<T>) {
	if (isLoading) return <LoadingSpinner/>;

	const effectiveActiveTab = activeTab || tabs?.[0]?.key;

	const activeTabConfig = tabs?.find((t) => t.key === effectiveActiveTab);

	const resolvedFilters =
		activeTabConfig?.filters ??
		filters;

	const resolvedFloatingActions =
		activeTabConfig?.floatingActions ??
		floatingActions;

	return (
		<>
			<VStack spacing={4} align={'stretch'}>
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

				{header}

				{resolvedFilters}

				{!tabs && children}

				{tabs && (
					<Tabs
						selectedKey={effectiveActiveTab}
						onSelectionChange={(key) => onTabChange?.(key as T)}
						aria-label={tabsAriaLabel}
					>
						{tabs.map((tab) => (
							<Tab key={tab.key} title={tab.title}>
								<VStack spacing={4} align="stretch">
									{tab.content}
								</VStack>
							</Tab>
						))}
					</Tabs>
				)}
			</VStack>

			{resolvedFloatingActions}
		</>
	);
}
