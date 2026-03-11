'use client';

import React from 'react';

import {Card as HeroCard} from '@heroui/card';

import {twMerge} from 'tailwind-merge';

import {Heading, Hide, LoadingSpinner, Show} from '@/components';
import {ContentCardProps} from '@/types';

import {CardBody, CardFooter, CardHeader} from './components';

export default function ContentCard({
  children,
  onPress,
  title,
  titleSize = 2,
  subtitle,
  isSelected = false,
  fullWidth = false,
  padding = 'none',
  footer,
  isLoading = false,
  emptyState,
  errorState,
  isPressable = false,
  actions,
  titleClassName,
  className = '',
}: ContentCardProps): React.ReactElement {
  const isInteractive = isPressable || !!onPress;

  const baseClass = isSelected
    ? 'bg-primary-50 border-2 border-primary-500 shadow-md'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700';

  const hoverClass = isInteractive && !isSelected ? 'hover:border-primary-300 hover:shadow-md' : '';

  const paddingClasses = {
    none: '',
    sm: 'px-3 py-3',
  };

  return (
    <HeroCard
      isPressable={isPressable ?? !!onPress}
      onPress={onPress}
      className={twMerge(`
							transition-all duration-200
							${baseClass}
							${isInteractive ? hoverClass : ''}
							${fullWidth ? 'w-full' : ''}
							${paddingClasses[padding]}
							${className}
						  `)}
    >
      <Show when={title}>
        <CardHeader className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 items-center">
              <Heading size={titleSize} className={titleClassName}>
                {title}
              </Heading>
            </div>
            {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
          </div>
          <Show when={actions && !emptyState && !errorState}>{actions}</Show>
        </CardHeader>
      </Show>
      <CardBody>
        <Show when={isLoading}>
          <LoadingSpinner />
        </Show>
        <Hide when={isLoading}>{errorState || emptyState || children}</Hide>
      </CardBody>
      <Show when={footer}>
        <CardFooter justify={'center'}>{footer}</CardFooter>
      </Show>
    </HeroCard>
  );
}
