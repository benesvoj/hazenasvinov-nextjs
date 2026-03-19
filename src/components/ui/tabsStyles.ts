import {TabsProps} from '@heroui/tabs';

// Shared visual defaults to keep tabs readable across light/dark themes.
export const sharedTabsClassNames: TabsProps['classNames'] = {
  base: 'w-full',
  tabList:
    'w-full gap-2 rounded-xl border border-default-200 dark:border-default-700 bg-default-100 dark:bg-default-900 shadow-sm',
  tab: [
    'min-w-fit text-sm font-semibold rounded-lg border',
    'transition-colors transition-shadow',

    'bg-default-50 dark:bg-default-800',
    'border-default-200 dark:border-default-700',

    'data-[hover=true]:bg-default-100',
    'dark:data-[hover=true]:bg-default-700',
    'data-[hover=true]:border-default-400',
    'dark:data-[hover=true]:border-default-500',
    'data-[hover=true]:shadow-sm',

    'data-[selected=true]:bg-primary/10',
    'data-[selected=true]:border-primary',
    'data-[selected=true]:shadow-sm',

    'data-[disabled=true]:opacity-50',
  ].join(' '),
  tabContent: [
    'text-gray-500 dark:text-default-400',
    'group-data-[hover=true]:text-primary',
    'group-data-[selected=true]:text-primary',
  ].join(' '),
  cursor: 'hidden',
};

export const sharedTabsProps: Partial<TabsProps> = {
  radius: 'md',
  disableAnimation: true,
  classNames: sharedTabsClassNames,
};
