import { LoadingSpinner } from "@/components";

interface AdminContainerProps {
  title: string;
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {icon && icon}
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            {actions && actions}
          </div>
          {children}
        </div>
      )}
    </>
  );
}
