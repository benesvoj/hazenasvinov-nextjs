'use client';

import React from 'react';

import {
  Card as HeroCard,
  CardBody as HeroCardBody,
  CardHeader as HeroCardHeader,
  CardFooter as HeroCardFooter,
} from '@heroui/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isPressable?: boolean;
  onPress?: () => void;
  radius?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function Card({
  children,
  className = '',
  isPressable = false,
  onPress,
  radius = 'lg',
  shadow = 'sm',
}: CardProps) {
  return (
    <HeroCard
      isPressable={isPressable}
      onPress={onPress}
      radius={radius}
      shadow={shadow}
      className={`w-full transition-all duration-200 hover:shadow-md ${className}`}
    >
      {children}
    </HeroCard>
  );
}

export function CardHeader({children, className = ''}: CardHeaderProps) {
  return <HeroCardHeader className={`px-4 sm:px-6 py-4 ${className}`}>{children}</HeroCardHeader>;
}

export function CardBody({children, className = '', padding = 'md'}: CardBodyProps) {
  const paddingClasses = {
    none: '',
    sm: 'px-3 py-3',
    md: 'px-4 sm:px-6 py-4',
    lg: 'px-6 sm:px-8 py-6',
  };

  return (
    <HeroCardBody className={`${paddingClasses[padding]} ${className}`}>{children}</HeroCardBody>
  );
}

export function CardFooter({children, className = '', justify = 'between'}: CardFooterProps) {
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <HeroCardFooter className={`px-4 sm:px-6 py-4 ${justifyClasses[justify]} ${className}`}>
      {children}
    </HeroCardFooter>
  );
}

// Responsive card grid component
interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function CardGrid({children, columns = 3, gap = 'md', className = ''}: CardGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  const gridGaps = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gridGaps[gap]} ${className}`}>{children}</div>
  );
}

// Responsive card list component
interface CardListProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CardList({children, gap = 'md', className = ''}: CardListProps) {
  const listGaps = {
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
  };

  return <div className={`${listGaps[gap]} ${className}`}>{children}</div>;
}

// Responsive card with actions
interface ActionCardProps extends CardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
}

export function ActionCard({
  title,
  subtitle,
  actions,
  content,
  footer,
  className = '',
  ...cardProps
}: ActionCardProps) {
  return (
    <Card className={className} {...cardProps}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>

      <CardBody>{content}</CardBody>

      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
