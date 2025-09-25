'use client';

import {Card, CardBody, CardHeader} from '@heroui/react';
import {Heading, HeadingLevel} from './Headings';

export interface UnifiedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  title?: string;
  titleSize?: HeadingLevel;
  isSelected?: boolean;
  fullWidth?: boolean;
}

export default function UnifiedCard({
  children,
  onPress,
  title,
  titleSize = 2,
  isSelected = false,
  fullWidth = false,
}: UnifiedCardProps) {
  const selectedClass = isSelected
    ? 'bg-primary-50 border-2 border-primary-500 shadow-md'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md';

  return (
    <Card
      isPressable={!!onPress}
      onPress={onPress}
      className={`
        transition-all duration-200 ${onPress ? 'cursor-pointer' : ''}
        ${selectedClass}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {title && (
        <CardHeader>
          {' '}
          <Heading size={titleSize}>{title}</Heading>
        </CardHeader>
      )}
      <CardBody className={fullWidth ? 'w-full' : ''}>
        <div className={fullWidth ? 'flex flex-col gap-2 justify-end' : ''}>{children}</div>
      </CardBody>
    </Card>
  );
}
