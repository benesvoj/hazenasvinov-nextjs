import {ActionItem} from '@/types';

export interface MobileActionsMenuProps {
  actions: ActionItem[];
  title?: string;
  description?: string;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerColor?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  triggerVariant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'ghost';
  triggerSize?: 'sm' | 'md' | 'lg';
  className?: string;
  showCloseButton?: boolean;
  closeOnAction?: boolean;
  fullWidth?: boolean;
  showOnDesktop?: boolean;
}
