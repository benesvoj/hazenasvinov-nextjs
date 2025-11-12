import React from 'react';

import {translations} from '@/lib';

interface StatusCellProps {
  isActive: boolean;
}

export const StatusCell: React.FC<StatusCellProps> = ({isActive}) => {
  const t = translations.members;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}
        title={isActive ? t.activeMember : t.inactiveMember}
      />
    </div>
  );
};
