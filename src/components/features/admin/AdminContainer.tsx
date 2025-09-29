import {LoadingSpinner, Heading} from '@/components';

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
        <div className="flex flex-col gap-4 items-center justify-between">
          {title && <AdminHeader title={title} description={description} icon={icon} />}
          {actions && <AdminActions>{actions}</AdminActions>}
          {filters && <AdminFilters>{filters}</AdminFilters>}
          <AdminContent>{children}</AdminContent>
        </div>
      )}
    </>
  );
}
