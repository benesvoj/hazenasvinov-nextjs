import {UnifiedCard} from '@/components';

interface AdminFiltersProps {
  children: React.ReactNode;
}

export const AdminFilters = ({children}: AdminFiltersProps) => {
  return (
    <div className="w-full">
      <UnifiedCard fullWidth variant="filters" contentAlignment="left" padding="sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">{children}</div>
      </UnifiedCard>
    </div>
  );
};
