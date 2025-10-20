import React from 'react';

import {ActionTypes} from '@/enums';

export interface ActionsProps {
  label: string;
  onClick?: () => void; // Made optional since statusTransition handles its own click logic
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'ghost';
  color?: 'default' | 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | undefined;
  icon?: React.ReactNode;
  buttonType: ActionTypes;
  isIconOnly?: boolean;
  isDisabled?: boolean;
  priority?: 'primary' | 'secondary'; // Controls whether action is shown directly or hidden under 3 dots menu
  // Status transition specific props
  statusTransition?: {
    currentStatus: any; // Generic status type
    onStatusChange: (id: string, newStatus: any) => void;
    itemId: string;
  };
}
