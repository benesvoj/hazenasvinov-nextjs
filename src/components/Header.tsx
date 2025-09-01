"use client";

import Image from "next/image";
import { texts } from "@/utils/texts";
import ThemeSwitch from "@/components/ThemeSwitch";
import Link from "@/components/Link";
import { useVisiblePages } from "@/hooks/useVisiblePages";
import { buildMenuFromPages, fallbackRoutes } from "../routes/dynamicRoutes";
import { MenuItem } from "../routes/dynamicRoutes";
import DropdownMenu from "@/components/DropdownMenu";
import Logo from "@/components/Logo";
import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { visiblePages, loading } = useVisiblePages();
  
  // Build menu items from visible pages, with fallback to static routes
  const menuItems: MenuItem[] = loading ? [] : buildMenuFromPages(visiblePages);

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo and Title */}
          <Link href={fallbackRoutes.home}>
            <div className="flex items-center space-x-3 lg:space-x-4">
              <Logo 
                size="md" 
                className="lg:w-12 lg:h-12" 
                alt={texts.club.title}
              />
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
            {menuItems.map((item: MenuItem) => {
              return item.children ? (
                <DropdownMenu key={item.title} item={item} />
              ) : (
                <Link
                  key={item.route}
                  href={item.route || ""}
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Right side - Theme switch, coaches portal, and mobile menu button */}
          <div className="flex items-center space-x-4">
            {/* Coaches Portal Link */}
            <Link
              href="/coaches/login"
              className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors border border-green-200 dark:border-green-700 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <span className="mr-2">🎯</span>
              Trenérský Portal
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

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Coaches Portal Link - Mobile */}
              <Link
                href="/coaches/login"
                className="block px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                🎯 Trenérský Portal
              </Link>
              
              {menuItems.map((item: MenuItem) => {
                return item.children ? (
                  <div key={item.title} className="space-y-1">
                    <div className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.title}
                    </div>
                    <div className="pl-4 space-y-1">
                      {item.children?.map((child: MenuItem) => (
                        <Link
                          key={child.route}
                          href={child.route || ""}
                          className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.route}
                    href={item.route || ""}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};


export default Header;