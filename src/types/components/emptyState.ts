import {EmptyStateTypes} from '@/enums';

export interface EmptyStateProps {
  title: string;
  description: string;
  type: EmptyStateTypes;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
