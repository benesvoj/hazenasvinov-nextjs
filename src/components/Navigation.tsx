import { useState } from "react";
import Link from "@/components/Link";
import { Button } from "@heroui/button";
import { 
  Bars3Icon, 
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";

interface NavigationItem {
  title: string;
  href?: string;
  children?: NavigationItem[];
  external?: boolean;
  badge?: {
    text: string;
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
  };
  icon?: React.ReactNode;
}

interface NavigationProps {
  items: NavigationItem[];
  variant?: "horizontal" | "vertical" | "mobile";
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

interface MobileNavigationProps {
  items: NavigationItem[];
  isOpen: boolean;
  onClose: () => void;
  onItemClick?: (item: NavigationItem) => void;
}

interface BreadcrumbProps {
  items: {
    title: string;
    href?: string;
    current?: boolean;
  }[];
  separator?: React.ReactNode;
  className?: string;
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  showPrevNext?: boolean;
  className?: string;
}

// Horizontal Navigation
export function HorizontalNavigation({
  items,
  className = "",
  onItemClick
}: NavigationProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleItemClick = (item: NavigationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    
    if (item.children) {
      setOpenDropdown(openDropdown === item.title ? null : item.title);
    } else {
      setOpenDropdown(null);
    }
  };

  return (
    <nav className={`flex items-center space-x-8 ${className}`}>
      {items.map((item) => (
        <div key={item.title} className="relative">
          {item.children ? (
            <div className="relative">
              <Button
                variant="light"
                className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                onPress={() => handleItemClick(item)}
                endContent={
                  <ChevronDownIcon 
                    className={`w-4 h-4 transition-transform ${
                      openDropdown === item.title ? 'rotate-180' : ''
                    }`} 
                  />
                }
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.title}
                {item.badge && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full bg-${item.badge.color || 'primary'}-100 text-${item.badge.color || 'primary'}-800 dark:bg-${item.badge.color || 'primary'}-900/20 dark:text-${item.badge.color || 'primary'}-400`}>
                    {item.badge.text}
                  </span>
                )}
              </Button>

              {openDropdown === item.title && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.href || "#"}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => {
                          if (onItemClick) onItemClick(child);
                          setOpenDropdown(null);
                        }}
                      >
                        {child.icon && <span className="w-4 h-4 mr-3">{child.icon}</span>}
                        {child.title}
                        {child.badge && (
                          <span className={`ml-auto px-2 py-1 text-xs rounded-full bg-${child.badge.color || 'primary'}-100 text-${child.badge.color || 'primary'}-800 dark:bg-${child.badge.color || 'primary'}-900/20 dark:text-${child.badge.color || 'primary'}-400`}>
                            {child.badge.text}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={item.href || "#"}
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={() => onItemClick?.(item)}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              {item.title}
              {item.badge && (
                <span className={`px-2 py-1 text-xs rounded-full bg-${item.badge.color || 'primary'}-100 text-${item.badge.color || 'primary'}-800 dark:bg-${item.badge.color || 'primary'}-900/20 dark:text-${item.badge.color || 'primary'}-400`}>
                  {item.badge.text}
                </span>
              )}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

// Vertical Navigation
export function VerticalNavigation({
  items,
  className = "",
  onItemClick
}: NavigationProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const handleItemClick = (item: NavigationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    
    if (item.children) {
      const newOpenItems = new Set(openItems);
      if (newOpenItems.has(item.title)) {
        newOpenItems.delete(item.title);
      } else {
        newOpenItems.add(item.title);
      }
      setOpenItems(newOpenItems);
    }
  };

  const renderItem = (item: NavigationItem, level: number = 0) => (
    <div key={item.title}>
      <div
        className={`flex items-center justify-between px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
          level === 0 
            ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 ml-4'
        }`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-center gap-3">
          {item.icon && <span className="w-4 h-4">{item.icon}</span>}
          <span>{item.title}</span>
          {item.badge && (
            <span className={`px-2 py-1 text-xs rounded-full bg-${item.badge.color || 'primary'}-100 text-${item.badge.color || 'primary'}-800 dark:bg-${item.badge.color || 'primary'}-900/20 dark:text-${item.badge.color || 'primary'}-400`}>
              {item.badge.text}
            </span>
          )}
        </div>
        
        {item.children && (
          <ChevronRightIcon 
            className={`w-4 h-4 transition-transform ${
              openItems.has(item.title) ? 'rotate-90' : ''
            }`} 
          />
        )}
      </div>
      
      {item.children && openItems.has(item.title) && (
        <div className="mt-1">
          {item.children.map((child) => renderItem(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map((item) => renderItem(item))}
    </nav>
  );
}

// Mobile Navigation
export function MobileNavigation({
  items,
  isOpen,
  onClose,
  onItemClick
}: MobileNavigationProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const handleItemClick = (item: NavigationItem) => {
    if (onItemClick) {
      onItemClick(item);
    }
    
    if (item.children) {
      const newOpenItems = new Set(openItems);
      if (newOpenItems.has(item.title)) {
        newOpenItems.delete(item.title);
      } else {
        newOpenItems.add(item.title);
      }
      setOpenItems(newOpenItems);
    } else {
      onClose();
    }
  };

  const renderMobileItem = (item: NavigationItem, level: number = 0) => (
    <div key={item.title}>
      <div
        className={`flex items-center justify-between px-4 py-3 text-base cursor-pointer transition-colors ${
          level === 0 
            ? 'text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700' 
            : 'text-gray-700 dark:text-gray-300 ml-4'
        }`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-center gap-3">
          {item.icon && <span className="w-5 h-5">{item.icon}</span>}
          <span>{item.title}</span>
          {item.badge && (
            <span className={`px-2 py-1 text-xs rounded-full bg-${item.badge.color || 'primary'}-100 text-${item.badge.color || 'primary'}-800 dark:bg-${item.badge.color || 'primary'}-900/20 dark:text-${item.badge.color || 'primary'}-400`}>
              {item.badge.text}
            </span>
          )}
        </div>
        
        {item.children && (
          <ChevronRightIcon 
            className={`w-5 h-5 transition-transform ${
              openItems.has(item.title) ? 'rotate-90' : ''
            }`} 
          />
        )}
      </div>
      
      {item.children && openItems.has(item.title) && (
        <div className="bg-gray-50 dark:bg-gray-800">
          {item.children.map((child) => renderMobileItem(child, level + 1))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
          <Button
            variant="light"
            size="sm"
            onPress={onClose}
          >
            <XMarkIcon className="w-6 h-6" />
          </Button>
        </div>
        
        <div className="overflow-y-auto h-full">
          {renderMobileItem({ title: "Zavřít", href: "#", onClick: onClose })}
          {items.map((item) => renderMobileItem(item))}
        </div>
      </div>
    </div>
  );
}

// Breadcrumb Navigation
export function Breadcrumb({
  items,
  separator = "/",
  className = ""
}: BreadcrumbProps) {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-gray-400 dark:text-gray-600">
              {separator}
            </span>
          )}
          
          {item.current ? (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.title}
            </span>
          ) : item.href ? (
            <Link
              href={item.href}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {item.title}
            </Link>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              {item.title}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Pagination
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  showPrevNext = true,
  className = ""
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {showPrevNext && (
        <Button
          size="sm"
          variant="outline"
          isDisabled={currentPage === 1}
          onPress={() => onPageChange(currentPage - 1)}
        >
          Předchozí
        </Button>
      )}
      
      {showPageNumbers && (
        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500 dark:text-gray-400">...</span>
              ) : (
                <Button
                  size="sm"
                  variant={page === currentPage ? "solid" : "outline"}
                  color={page === currentPage ? "primary" : "default"}
                  onPress={() => onPageChange(page as number)}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {showPrevNext && (
        <Button
          size="sm"
          variant="outline"
          isDisabled={currentPage === totalPages}
          onPress={() => onPageChange(currentPage + 1)}
        >
          Další
        </Button>
      )}
    </div>
  );
}
