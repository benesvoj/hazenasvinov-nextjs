'use client';

import {texts} from '@/utils/texts';
import ThemeSwitch from '@/components/ThemeSwitch';
import Link from '@/components/Link';
import {useVisiblePages} from '@/hooks/entities/settings/useVisiblePages';
import {buildMenuFromPages, fallbackRoutes} from '../routes/dynamicRoutes';
import {MenuItem} from '../routes/dynamicRoutes';
import DropdownMenu from '@/components/DropdownMenu';
import Logo from '@/components/Logo';
import {useState} from 'react';
import {Bars3Icon, XMarkIcon} from '@heroicons/react/24/outline';
import {Button} from '@heroui/react';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {visiblePages, loading, error} = useVisiblePages();

  // Build menu items from visible pages, with fallback to static routes
  const menuItems: MenuItem[] = loading ? [] : buildMenuFromPages(visiblePages);

  // Fallback menu items if none are available
  const fallbackMenuItems: MenuItem[] = [
    {title: 'Domů', route: '/'},
    {title: 'O nás', route: '/about'},
    {title: 'Novinky', route: '/news'},
    {title: 'Kontakt', route: '/contact'},
  ];

  // Use dynamic menu items if available, otherwise fallback
  const displayMenuItems = menuItems.length > 0 ? menuItems : fallbackMenuItems;

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo and Title */}
          <Link href={fallbackRoutes.home}>
            <div className="flex items-center space-x-3 lg:space-x-4">
              <Logo size="md" className="lg:w-12 lg:h-12" alt={texts.club.title} />
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                  {texts.club.title}
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400">
                  {texts.club.subtitle}
                </p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {displayMenuItems.map((item: MenuItem) => {
              return item.children ? (
                <DropdownMenu
                  key={item.title}
                  item={item}
                  className="text-sm text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                />
              ) : (
                <Link
                  key={item.route}
                  href={item.route || ''}
                  className="text-sm font-semibold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Theme switch, portal, and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Portal Link */}
            {/* TODO: replace with routes.admin */}
            <Link
              href="/login"
              className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors border border-green-200 dark:border-green-700 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <span className="mr-2">🎯</span>
              Portal
            </Link>

            <ThemeSwitch />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Simple Full Screen */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[9999] lg:hidden bg-white dark:bg-gray-900"
            style={{
              zIndex: 9999,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 h-16">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Menu</h2>
              <Button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Zavřít menu"
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setIsMobileMenuOpen(false)}
              >
                <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </Button>
            </div>

            {/* Navigation Content - Scrollable */}
            <div
              className="overflow-y-auto p-4 space-y-2 bg-white dark:bg-gray-900"
              style={{
                height: 'calc(100vh - 64px)',
              }}
            >
              {/* Menu items */}
              {displayMenuItems.map((item: MenuItem) => {
                if (item.children) {
                  // Category with sub-items - Two columns layout
                  return (
                    <div key={item.title} className="space-y-2">
                      <div className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                        {item.title}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {item.children.map((child: MenuItem) => (
                          <Link
                            key={child.route || child.title}
                            href={child.route || '#'}
                            className="block p-3 text-center text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  // Regular menu item
                  return (
                    <Link
                      key={item.route || item.title}
                      href={item.route || '#'}
                      className="block w-full p-4 text-left text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.title}
                    </Link>
                  );
                }
              })}

              {/* Portal Link - Bottom */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/login"
                  className="block w-full p-4 text-center text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="text-xl mr-3">🎯</span>
                  Portal
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
