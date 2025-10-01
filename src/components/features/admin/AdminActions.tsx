import {Button} from '@heroui/react';

import {translations} from '@/lib/translations';

import {UnifiedCard, showToast} from '@/components';
import {getStatusButtonInfo, getNextStatus, getStatusLabel, getDefaultActionIcon} from '@/helpers';
import {ActionsProps} from '@/types';

interface AdminActionsProps {
  actions: ActionsProps[];
}

export const AdminActions = ({actions}: AdminActionsProps) => {
  const tAction = translations.action;
  const tCommon = translations.common;

  return (
    <div className="w-full">
      <UnifiedCard fullWidth variant="actions" contentAlignment="right" padding="sm">
        <div className="flex gap-2 justify-end">
          {actions.map((action, index) => {
            // Handle status transition actions
            if (action.statusTransition) {
              const {currentStatus, onStatusChange, itemId} = action.statusTransition;
              const buttonInfo = getStatusButtonInfo(currentStatus);

              if (!buttonInfo) return null;

              return (
                <Button
                  key={index}
                  size="sm"
                  variant="light"
                  color={buttonInfo.color}
                  isDisabled={action.isDisabled}
                  isIconOnly
                  onPress={() => {
                    const nextStatus = getNextStatus(currentStatus);
                    if (nextStatus) {
                      showToast.success(
                        `${tAction.moveStatusFrom} ${getStatusLabel(currentStatus)} ${tAction.moveStatusTo} ${getStatusLabel(nextStatus)}`
                      );
                      onStatusChange(itemId, nextStatus);
                    }
                  }}
                  title={`${buttonInfo.text} ${tCommon.item}`}
                >
                  {buttonInfo.icon}
                </Button>
              );
            }

            // Handle regular actions
            if (!action.onClick) return null; // Skip if no onClick provided

            return (
              <Button
                key={index}
                size="sm"
                aria-label={action.label}
                title={action.label}
                onPress={action.onClick}
                variant={action.variant || 'bordered'}
                color={action.color || 'primary'}
                startContent={getDefaultActionIcon(action.buttonType)}
                isIconOnly={action.isIconOnly}
                isDisabled={action.isDisabled}
              >
                {!action.isIconOnly && action.label}
              </Button>
            );
          })}
        </div>
      </UnifiedCard>
    </div>
  );
};
