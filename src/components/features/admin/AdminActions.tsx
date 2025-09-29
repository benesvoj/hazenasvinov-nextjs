import {UnifiedCard} from '@/components';

interface AdminActionsProps {
  children: React.ReactNode;
}

export const AdminActions = ({children}: AdminActionsProps) => {
  return (
    <div className="w-full">
      <UnifiedCard fullWidth variant="actions" contentAlignment="right" padding="sm">
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">{children}</div>
      </UnifiedCard>
    </div>
  );
};
