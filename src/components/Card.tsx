import { Card as HeroCard, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Divider } from "@heroui/divider";
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PlusIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  isPressable?: boolean;
  onPress?: () => void;
}

interface SimpleCardProps extends BaseCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: {
    src: string;
    alt: string;
    height?: string;
  };
  actions?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: React.ReactNode;
  }[];
  footer?: React.ReactNode;
  badges?: {
    text: string;
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow";
  }[];
}

interface StatsCardProps extends BaseCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
}

interface FeatureCardProps extends BaseCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link?: {
    href: string;
    label: string;
  };
}

interface ActionCardProps extends BaseCardProps {
  title: string;
  description: string;
  action: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

// Simple Card with header, body, and optional footer
export function SimpleCard({
  title,
  subtitle,
  description,
  image,
  actions,
  footer,
  badges,
  children,
  className = "",
  shadow = "md",
  isPressable = false,
  onPress
}: SimpleCardProps) {
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl"
  };

  return (
    <HeroCard 
      className={`${shadowClasses[shadow]} ${className}`}
      isPressable={isPressable}
      onPress={onPress}
    >
      {(title || subtitle || badges) && (
        <CardHeader className="pb-3">
          {badges && badges.length > 0 && (
            <div className="flex gap-2 mb-2">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  color={badge.color || "default"}
                  variant={badge.variant || "light"}
                  size="sm"
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}
          
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </CardHeader>
      )}

      {image && (
        <div className="px-6">
          <img
            src={image.src}
            alt={image.alt}
            className={`w-full object-cover rounded-lg ${image.height || 'h-48'}`}
          />
        </div>
      )}

      <CardBody className="pt-0">
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
        )}
        {children}
      </CardBody>

      {(actions || footer) && (
        <CardFooter className="pt-0">
          {actions && actions.length > 0 && (
            <div className="flex gap-2 w-full">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size={action.size || "sm"}
                  variant={action.variant || "outline"}
                  color={action.color || "primary"}
                  onClick={action.onClick}
                  startContent={action.icon}
                  className="flex-1"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
          
          {footer && (
            <div className="w-full">
              {actions && actions.length > 0 && <Divider className="my-3" />}
              {footer}
            </div>
          )}
        </CardFooter>
      )}
    </HeroCard>
  );
}

// Stats Card for displaying metrics
export function StatsCard({
  title,
  value,
  change,
  icon,
  trend,
  className = "",
  shadow = "md"
}: StatsCardProps) {
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl"
  };

  const getTrendColor = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <HeroCard className={`${shadowClasses[shadow]} ${className}`}>
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {value}
            </p>
            
            {change && (
              <div className="flex items-center mt-2">
                <span className={`text-sm font-medium ${getTrendColor(change.isPositive ? "up" : "down")}`}>
                  {change.isPositive ? "+" : "-"}{Math.abs(change.value)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                  {change.period}
                </span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 text-blue-600 dark:text-blue-400">
                  {icon}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </HeroCard>
  );
}

// Feature Card for highlighting features
export function FeatureCard({
  title,
  description,
  icon,
  link,
  className = "",
  shadow = "md"
}: FeatureCardProps) {
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl"
  };

  return (
    <HeroCard className={`${shadowClasses[shadow]} ${className}`}>
      <CardBody className="p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
            <div className="w-6 h-6 text-blue-600 dark:text-blue-400">
              {icon}
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
          
          {link && (
            <Button
              as="a"
              href={link.href}
              variant="light"
              color="primary"
              endContent={<ArrowRightIcon className="w-4 h-4" />}
              className="mx-auto"
            >
              {link.label}
            </Button>
          )}
        </div>
      </CardBody>
    </HeroCard>
  );
}

// Action Card for call-to-action items
export function ActionCard({
  title,
  description,
  action,
  className = "",
  shadow = "md"
}: ActionCardProps) {
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl"
  };

  return (
    <HeroCard className={`${shadowClasses[shadow]} ${className}`}>
      <CardBody className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {description}
          </p>
          
          <Button
            onClick={action.onClick}
            color="primary"
            variant="solid"
            startContent={action.icon}
            className="mx-auto"
          >
            {action.label}
          </Button>
        </div>
      </CardBody>
    </HeroCard>
  );
}

// Quick Action Card for common actions
export function QuickActionCard({
  title,
  description,
  action,
  className = "",
  shadow = "sm"
}: ActionCardProps) {
  return (
    <ActionCard
      title={title}
      description={description}
      action={action}
      className={className}
      shadow={shadow}
    />
  );
}

// Info Card for displaying information
export function InfoCard({
  title,
  children,
  className = "",
  shadow = "sm"
}: BaseCardProps & { title: string }) {
  return (
    <SimpleCard
      title={title}
      className={className}
      shadow={shadow}
    >
      {children}
    </SimpleCard>
  );
}
