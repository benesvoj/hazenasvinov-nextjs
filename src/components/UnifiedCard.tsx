'use client';

import {Card, CardBody, CardHeader} from '@heroui/react';
import {Heading, HeadingLevel} from './Headings';

export interface UnifiedCardProps {
  children: React.ReactNode;
  onPress: () => void;
  title: string;
  titleSize: HeadingLevel;
  isSelected?: boolean;
}

export default function UnifiedCard({
  children,
  onPress,
  title,
  titleSize,
  isSelected = false,
}: UnifiedCardProps) {
  const selectedClass = isSelected
    ? 'bg-primary-50 border-2 border-primary-500 shadow-md'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md';

  return (
    <Card
      isPressable
      onPress={onPress}
      className={`
        transition-all duration-200 cursor-pointer
        ${selectedClass}
      `}
    >
      <CardHeader>
        <Heading size={titleSize}>{title}</Heading>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}
