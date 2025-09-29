import {Tooltip, Button} from '@heroui/react';

export interface ButtonWithTooltipProps {
  children?: React.ReactNode;
  tooltip: string;
  onPress: () => void;
  ariaLabel: string;
  isIconOnly: boolean;
  isDanger?: boolean;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'light' | 'bordered' | 'solid' | 'shadow' | 'ghost';
  startContent?: React.ReactNode;
}

export const ButtonWithTooltip = ({
  children,
  tooltip,
  onPress,
  ariaLabel,
  isIconOnly,
  isDanger,
  isDisabled,
  size,
  variant,
  startContent,
}: ButtonWithTooltipProps) => {
  return (
    <Tooltip content={tooltip}>
      <Button
        size={size || 'sm'}
        variant={variant || 'bordered'}
        isIconOnly={isIconOnly}
        onPress={onPress}
        aria-label={ariaLabel}
        color={isDanger ? 'danger' : 'default'}
        isDisabled={isDisabled}
        startContent={startContent}
      >
        {children}
      </Button>
    </Tooltip>
  );
};
