import {EmptyStateTypes} from '@/enums';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'ghost';
  };
  className?: string;
  type?: EmptyStateTypes;
}
