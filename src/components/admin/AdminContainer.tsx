import {LoadingSpinner, Heading, UnifiedCard} from '@/components';

interface AdminContainerProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
}

export function AdminContainer({
  children,
  title,
  description,
  icon,
  actions,
  loading,
}: AdminContainerProps) {
  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              {title && (
                <Heading size={1}>
                  {icon && icon}
                  {title}
                </Heading>
              )}
              {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
            </div>
            {actions && <UnifiedCard fullWidth>{actions}</UnifiedCard>}
          </div>
          {children}
        </div>
      )}
    </>
  );
}
