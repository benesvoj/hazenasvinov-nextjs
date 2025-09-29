import {UnifiedCard} from '@/components';

interface AdminActionsProps {
  children: React.ReactNode;
}

export const AdminActions = ({children}: AdminActionsProps) => {
  return (
    <UnifiedCard fullWidth variant="actions" contentAlignment="right">
      {children}
    </UnifiedCard>
  );
};
