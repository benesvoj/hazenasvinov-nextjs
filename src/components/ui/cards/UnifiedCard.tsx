'use client';

import React from 'react';

import {Button, Card, CardBody, CardFooter, CardHeader} from '@heroui/react';

import {LoadingSpinner, Heading, showToast} from '@/components';
import {getDefaultActionIcon, getNextStatus, getStatusButtonInfo, getStatusLabel} from '@/helpers';
import {UnifiedCardProps} from '@/types';

import {renderEmptyState} from '../feedback/EmptyState';

/**
 * Renders a customizable, reusable card component with optional header, footer, content, and action buttons.
 *
 * @param {Object} props The properties for configuring the UnifiedCard component.
 * @param {React.ReactNode} props.children The content to be displayed within the card body.
 * @param {function} [props.onPress] A callback function to handle card press actions.
 * @param {string} [props.title] The title to be displayed in the card header.
 * @param {number} [props.titleSize=2] The size level of the title, determining its visual appearance.
 * @param {string} [props.subtitle] The subtitle to be displayed beneath the title in the card header.
 * @param {boolean} [props.isSelected=false] Indicates if the card is in a selected state.
 * @param {boolean} [props.fullWidth=false] Determines if the card should span the full width of its container.
 * @param {'left'|'center'|'right'|'justify-between'} [props.contentAlignment='left'] Controls the alignment of card content.
 * @param {'none'|'sm'|'md'|'lg'} [props.padding='sm'] Specifies the internal padding of the card.
 * @param {'default'|'actions'|'filters'|'content'} [props.variant='default'] Determines the style variant of the card.
 * @param {React.ReactNode} [props.footer] Content to be rendered in the footer of the card.
 * @param {boolean} [props.isLoading=false] Displays a loading spinner when set to true.
 * @param {string} [props.emptyStateType] Indicates the type of empty state to be displayed if no content is available.
 * @param {boolean} [props.isPressable=false] Specifies if the card is pressable (has hover and click interactions).
 * @param {Array} [props.actions] A list of actions (buttons) to be displayed in the card header.
 * @return {React.ReactElement} A rendered card component with the configured properties and structure.
 */
export default function UnifiedCard({
  children,
  onPress,
  title,
  titleSize = 2,
  subtitle,
  isSelected = false,
  fullWidth = false,
  contentAlignment = 'left',
  padding = 'sm',
  variant = 'default',
  footer,
  isLoading = false,
  emptyStateType,
  isPressable = false,
  actions,
  icon,
}: UnifiedCardProps): React.ReactElement {
  const selectedClass = isSelected
    ? 'bg-primary-50 border-2 border-primary-500 shadow-md'
    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md';

  const contentAlignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    'justify-between': 'justify-between',
  };

  const paddingClasses = {
    none: '',
    sm: 'px-3 py-3',
    md: 'px-4 sm:px-6 py-4',
    lg: 'px-6 sm:px-8 py-6',
  };

  const variantClasses = {
    default: '',
    actions: 'p-0',
    filters: 'p-0',
    content: 'p-0',
  };

  return (
    <>
      {isLoading ? (
        <Card>
          <CardBody>
            <LoadingSpinner />
          </CardBody>
        </Card>
      ) : (
        <Card
          isPressable={isPressable ?? !!onPress}
          onPress={onPress}
          className={`
        transition-all duration-200 ${(isPressable ?? !!onPress) ? 'cursor-pointer' : ''}
        ${selectedClass}
        ${fullWidth ? 'w-full' : ''}
        ${contentAlignmentClasses[contentAlignment]}
        ${paddingClasses[padding]}
        ${variantClasses[variant]}
      `}
        >
          {title && (
            <CardHeader className="flex justify-between items-center">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                  {icon && <>{icon}</>}
                  <Heading size={titleSize}>{title}</Heading>
                </div>
                {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
              </div>
              {actions && actions.length > 0 && (
                <div className="flex gap-2">
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
                                `Item moved from ${getStatusLabel(currentStatus)} to ${getStatusLabel(nextStatus)}`
                              );
                              onStatusChange(itemId, nextStatus);
                            }
                          }}
                          title={`${buttonInfo.text} item`}
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
              )}
            </CardHeader>
          )}
          {emptyStateType ? (
            <CardBody className={fullWidth ? 'w-full' : ''}>
              {renderEmptyState(emptyStateType, () => onPress)}
            </CardBody>
          ) : (
            <CardBody className={fullWidth ? 'w-full' : ''}>
              <div className={fullWidth ? 'flex flex-col gap-2 justify-end' : ''}>{children}</div>
            </CardBody>
          )}
          {footer && <CardFooter className="flex justify-center">{footer}</CardFooter>}
        </Card>
      )}
    </>
  );
}
