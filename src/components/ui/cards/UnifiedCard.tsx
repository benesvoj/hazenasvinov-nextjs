'use client';

import {Card, CardBody, CardFooter, CardHeader} from '@heroui/react';

import {LoadingSpinner, Heading} from '@/components';
import {EmptyStateTypes} from '@/enums';

import {renderEmptyState} from '../feedback/EmptyState';
import {HeadingLevel} from '../heading/Heading';

export interface UnifiedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  title?: string;
  titleSize?: HeadingLevel;
  isSelected?: boolean;
  fullWidth?: boolean;
  contentAlignment?: 'left' | 'center' | 'right' | 'justify-between';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'actions' | 'filters' | 'content';
  footer?: React.ReactNode;
  isLoading?: boolean;
  emptyStateType?: EmptyStateTypes;
}

export default function UnifiedCard({
  children,
  onPress,
  title,
  titleSize = 2,
  isSelected = false,
  fullWidth = false,
  contentAlignment = 'left',
  padding = 'md',
  variant = 'default',
  footer,
  isLoading = false,
  emptyStateType,
}: UnifiedCardProps) {
  const selectedClass = isSelected
    ? 'bg-primary-50 border-2 border-primary-500 shadow-md'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md';

  const contentAlignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    'justify-between': 'justify-between',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-3 py-3',
    md: 'px-4 sm:px-6 py-4',
    lg: 'px-6 sm:px-8 py-6',
  };

  const variantClasses = {
    default: '',
    actions: 'p-0',
    filters: 'p-0',
    content: 'p-0',
  };

  return (
    <>
      {isLoading ? (
        <Card>
          <CardBody>
            <LoadingSpinner />
          </CardBody>
        </Card>
      ) : (
        <Card
          isPressable={!!onPress}
          onPress={onPress}
          className={`
        transition-all duration-200 ${onPress ? 'cursor-pointer' : ''}
        ${selectedClass}
        ${fullWidth ? 'w-full' : ''}
        ${contentAlignmentClasses[contentAlignment]}
        ${paddingClasses[padding]}
        ${variantClasses[variant]}
      `}
        >
          {title && (
            <CardHeader>
              <Heading size={titleSize}>{title}</Heading>
            </CardHeader>
          )}
          {emptyStateType ? (
            <CardBody className={fullWidth ? 'w-full' : ''}>
              {renderEmptyState(emptyStateType, onPress || (() => {}))}
            </CardBody>
          ) : (
            <CardBody className={fullWidth ? 'w-full' : ''}>
              <div className={fullWidth ? 'flex flex-col gap-2 justify-end' : ''}>{children}</div>
            </CardBody>
          )}
          {footer && <CardFooter>{footer}</CardFooter>}
        </Card>
      )}
    </>
  );
}
