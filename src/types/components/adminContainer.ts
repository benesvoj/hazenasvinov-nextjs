import {ActionsProps} from '@/types';

export interface AdminContainerProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: ActionsProps[];
  filters?: React.ReactNode;
  loading?: boolean;
}
