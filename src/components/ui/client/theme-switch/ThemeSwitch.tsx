'use client';

import {useSyncExternalStore} from 'react';

import {Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger} from '@heroui/react';

import {ComputerDesktopIcon, MoonIcon, SunIcon} from '@heroicons/react/24/outline';

import {useTheme} from 'next-themes';

import {translations} from '@/lib/translations/index';

const ThemeSwitch = () => {
  const {theme, setTheme, resolvedTheme} = useTheme();

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="mr-5 flex items-center">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="opacity-0"
          aria-label="Theme switcher (loading)"
        >
          <SunIcon className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  const getThemeIcon = () => {
    switch (resolvedTheme) {
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="mr-5 flex items-center">
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            aria-label="Theme switcher"
            className="hover:text-primary-500 dark:hover:text-primary-400"
          >
            {getThemeIcon()}
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="Theme options"
          selectedKeys={[theme || 'system']}
          onAction={(key) => {
            setTheme(key as string);
          }}
        >
          <DropdownItem key="light" startContent={<SunIcon className="w-4 h-4" />}>
            {translations.components.themeSwitch.light}
          </DropdownItem>
          <DropdownItem key="dark" startContent={<MoonIcon className="w-4 h-4" />}>
            {translations.components.themeSwitch.dark}
          </DropdownItem>
          <DropdownItem key="system" startContent={<ComputerDesktopIcon className="w-4 h-4" />}>
            {translations.components.themeSwitch.system}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};

export default ThemeSwitch;
