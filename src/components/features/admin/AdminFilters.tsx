import {UnifiedCard} from '@/components';

interface AdminFiltersProps {
  children: React.ReactNode;
}

export const AdminFilters = ({children}: AdminFiltersProps) => {
  return <UnifiedCard fullWidth>{children}</UnifiedCard>;
};
