'use client';

import {Button} from '@heroui/react';

import {EllipsisVerticalIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {UnifiedCard, showToast, MobileActionsMenu} from '@/components';
import {getStatusButtonInfo, getNextStatus, getStatusLabel, getDefaultActionIcon} from '@/helpers';
import {ActionsProps, ActionItem} from '@/types';

interface AdminActionsProps {
  actions: ActionsProps[];
}

// Helper function to convert ActionsProps to ActionItem format
const convertToActionItems = (actions: ActionsProps[]): ActionItem[] => {
  return actions
    .filter((action) => action.onClick || action.statusTransition) // Only include actions with click handlers
    .map((action, index) => {
      // Handle status transition actions
      if (action.statusTransition) {
        const {currentStatus, onStatusChange, itemId} = action.statusTransition;
        const buttonInfo = getStatusButtonInfo(currentStatus);

        if (!buttonInfo) return null;

        return {
          key: `status-${index}`,
          label: buttonInfo.text,
          icon: buttonInfo.icon,
          color: buttonInfo.color as any,
          variant: 'light' as any,
          onClick: () => {
            const nextStatus = getNextStatus(currentStatus);
            if (nextStatus) {
              showToast.success(
                `${translations.action.moveStatusFrom} ${getStatusLabel(currentStatus)} ${translations.action.moveStatusTo} ${getStatusLabel(nextStatus)}`
              );
              onStatusChange(itemId, nextStatus);
            }
          },
          isDisabled: action.isDisabled,
        };
      }

      // Handle regular actions
      return {
        key: `action-${index}`,
        label: action.label,
        icon: action.icon || getDefaultActionIcon(action.buttonType),
        color: action.color as any,
        variant: (action.variant || 'bordered') as any,
        onClick: action.onClick!,
        isDisabled: action.isDisabled,
      };
    })
    .filter(Boolean) as ActionItem[];
};

// Helper function to separate actions by priority
const separateActionsByPriority = (actions: ActionsProps[]) => {
  const primaryActions = actions.filter((action) => action.priority !== 'secondary');
  const secondaryActions = actions.filter((action) => action.priority === 'secondary');
  return {primaryActions, secondaryActions};
};

export const AdminActions = ({actions}: AdminActionsProps) => {
  const tAction = translations.action;
  const tCommon = translations.common;
  const {primaryActions, secondaryActions} = separateActionsByPriority(actions);
  const mobileActions = convertToActionItems(actions);
  const secondaryActionItems = convertToActionItems(secondaryActions);

  return (
    <UnifiedCard fullWidth variant="actions" contentAlignment="right" padding="sm">
      {/* Desktop Actions - Hidden on mobile */}
      <div className="hidden lg:flex gap-2 justify-end">
        {/* Primary Actions - Always visible */}
        {primaryActions.map((action, index) => {
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

        {/* Secondary Actions - Hidden under 3 dots menu */}
        {secondaryActionItems.length > 0 && (
          <MobileActionsMenu
            actions={secondaryActionItems}
            title="Další akce"
            description="Vyberte další dostupnou akci"
            triggerLabel=""
            triggerIcon={<EllipsisVerticalIcon className="w-4 h-4" />}
            triggerColor="default"
            triggerSize="sm"
            fullWidth={false}
            showOnDesktop={true}
          />
        )}
      </div>

      {/* Mobile Actions Menu - Only visible on mobile */}
      <div className="lg:hidden flex justify-end">
        <MobileActionsMenu
          actions={mobileActions}
          title="Dostupné akce"
          description="Vyberte akci, kterou chcete provést"
          triggerLabel="Akce"
          triggerColor="primary"
          triggerVariant="bordered"
          triggerSize="sm"
          fullWidth={false}
          showOnDesktop={false}
        />
      </div>
    </UnifiedCard>
  );
};
