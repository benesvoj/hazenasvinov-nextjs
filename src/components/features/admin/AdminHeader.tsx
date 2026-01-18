'use client';

import {Heading} from '@/components';

interface AdminHeaderProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const AdminHeader = ({title, description, icon}: AdminHeaderProps) => {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {title && (
          <div className="flex items-center gap-3">
            <Heading size={1}>
              {icon && <span className="flex-shrink-0 mr-3">{icon}</span>}
              {title}
            </Heading>
          </div>
        )}
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{description}</p>
        )}
      </div>
    </div>
  );
};
