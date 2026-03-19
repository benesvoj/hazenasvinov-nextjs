'use client';

import {Heading, HStack, VStack} from '@/components';

interface AdminHeaderProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const AdminHeader = ({title, description, icon}: AdminHeaderProps) => {
  return (
    <div className="w-full">
      <VStack spacing={2} align={'start'}>
        {title && (
          <HStack spacing={2} align={'center'}>
            <Heading size={1}>
              {icon && <span className="shrink-0 mr-3">{icon}</span>}
              {title}
            </Heading>
          </HStack>
        )}
        {description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{description}</p>
        )}
      </VStack>
    </div>
  );
};
