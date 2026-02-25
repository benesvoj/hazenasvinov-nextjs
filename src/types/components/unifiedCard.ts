import React from 'react';

import {HeadingLevel} from '@/components/ui/heading/Heading';

import {EmptyStateTypes} from '@/enums';
import {ActionsProps} from '@/types';

export interface UnifiedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  title?: string | React.ReactNode;
  titleSize?: HeadingLevel;
  subtitle?: string | React.ReactNode;
  isSelected?: boolean;
  fullWidth?: boolean;
  contentAlignment?: 'left' | 'center' | 'right' | 'justify-between';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'actions' | 'filters' | 'content';
  footer?: React.ReactNode;
  isLoading?: boolean;
  emptyStateType?: EmptyStateTypes;
  isPressable?: boolean;
  actions?: ActionsProps[];
  icon?: React.ReactNode;
}
