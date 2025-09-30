import {ButtonTypes} from '@/enums';

export interface ActionsProps {
  label: string;
  onClick?: () => void; // Made optional since statusTransition handles its own click logic
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'ghost';
  color?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | undefined;
  icon?: React.ReactNode;
  buttonType: ButtonTypes;
  isIconOnly?: boolean;
  isDisabled?: boolean;
  // Status transition specific props
  statusTransition?: {
    currentStatus: any; // Generic status type
    onStatusChange: (id: string, newStatus: any) => void;
    itemId: string;
  };
}
