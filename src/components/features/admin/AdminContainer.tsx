import {LoadingSpinner} from '@/components';
import {AdminContainerProps} from '@/types';

import {AdminFilters, AdminContent, AdminHeader, AdminActions} from './';

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
              {actions && actions.length > 0 && <AdminActions actions={actions} />}
              {filters && <AdminFilters>{filters}</AdminFilters>}
            </div>
          )}

          <AdminContent>{children}</AdminContent>
        </div>
      )}
    </>
  );
}
