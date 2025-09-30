import React from 'react';

import {HeadingLevel} from '@/components/ui/heading/Heading';

import {ButtonTypes, EmptyStateTypes} from '@/enums';

export interface UnifiedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  title?: string | React.ReactNode;
  titleSize?: HeadingLevel;
  subtitle?: string;
  isSelected?: boolean;
  fullWidth?: boolean;
  contentAlignment?: 'left' | 'center' | 'right' | 'justify-between';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'actions' | 'filters' | 'content';
  footer?: React.ReactNode;
  isLoading?: boolean;
  emptyStateType?: EmptyStateTypes;
  isPressable?: boolean;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'ghost';
    color?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | undefined;
    icon?: React.ReactNode;
    buttonType: ButtonTypes;
    isIconOnly?: boolean;
  }[];
}
