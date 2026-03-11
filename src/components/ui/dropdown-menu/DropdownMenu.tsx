'use client';

import {useState} from 'react';

import {Popover, PopoverContent, PopoverTrigger} from '@heroui/popover';

import Link from '@/components/ui/link/Link';

import {MenuItem} from '@/lib/navigation';

import {isEmpty} from '@/utils';

interface Props {
  item: MenuItem;
  className?: string;
}

export default function DropdownMenu(props: Props) {
  const {item, className} = props;
  const menuItems = item?.children || [];
  const [isOpen, setIsOpen] = useState(false);

  if (isEmpty(menuItems)) {
    return null;
  }

  return (
    <Popover placement="bottom" isOpen={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className={`inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900 ${className || ''} cursor-pointer`}
      >
        <span>{item.title}</span>
      </PopoverTrigger>
      <PopoverContent className="cursor-pointer">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {menuItems.map((menuItem) => (
              <Link
                key={menuItem.title}
                href={menuItem.href || '#'}
                onClick={() => setIsOpen(false)}
                className="flex gap-x-6 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {menuItem.title}
                  </div>
                  {menuItem.description && (
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{menuItem.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
