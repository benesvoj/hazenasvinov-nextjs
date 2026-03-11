import React from 'react';

import {HeadingLevel} from '@/components/ui/heading/Heading';

export interface ContentCardProps {
  children?: React.ReactNode;
  onPress?: () => void;
  title?: string | React.ReactNode;
  titleSize?: HeadingLevel;
  subtitle?: string | React.ReactNode;
  isSelected?: boolean;
  fullWidth?: boolean;
  padding?: 'none' | 'sm';
  footer?: React.ReactNode;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  isPressable?: boolean;
  actions?: React.ReactNode;
  titleClassName?: string;
  className?: string;
}
