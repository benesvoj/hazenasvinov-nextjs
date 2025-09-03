import { Tooltip, Button } from "@heroui/react"

export interface ButtonWithTooltipProps {
    children: React.ReactNode,
    tooltip: string,
    onPress: () => void,
    ariaLabel: string,
    isIconOnly: boolean,
    isDanger?: boolean 
}


export const ButtonWithTooltip = ({ children, tooltip, onPress, ariaLabel, isIconOnly, isDanger }: ButtonWithTooltipProps) => {
    return (
        <Tooltip content={tooltip}>
            <Button
            size="sm"
            variant="bordered"
            isIconOnly={isIconOnly}
            onPress={onPress}
            aria-label={ariaLabel}
            color={isDanger ? "danger" : "default"}
          >
            {children}
          </Button>
        </Tooltip>
    )
}