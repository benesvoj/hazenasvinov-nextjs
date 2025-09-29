import {LoadingSpinner} from '@/components';

import {AdminActions, AdminFilters, AdminContent, AdminHeader} from './';

interface AdminContainerProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  loading?: boolean;
}

export function AdminContainer({
  children,
  title,
  description,
  icon,
  actions,
  filters,
  loading,
}: AdminContainerProps) {
  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full space-y-4">
          {(title || description || icon) && (
            <AdminHeader title={title} description={description} icon={icon} />
          )}

          {(actions || filters) && (
            <div className="flex flex-col gap-4">
              {actions && (
                <div className="w-full">
                  <AdminActions>{actions}</AdminActions>
                </div>
              )}
              {filters && (
                <div className="w-full">
                  <AdminFilters>{filters}</AdminFilters>
                </div>
              )}
            </div>
          )}

          <AdminContent>{children}</AdminContent>
        </div>
      )}
    </>
  );
}
