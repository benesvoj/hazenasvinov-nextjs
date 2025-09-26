import React from 'react';
import {Button} from '@heroui/react';
import {UserGroupIcon, PlusIcon} from '@heroicons/react/24/outline';

interface LineupEmptyStateProps {
  onAddPlayer: () => void;
  t: any;
}

const LineupEmptyState: React.FC<LineupEmptyStateProps> = ({onAddPlayer, t}) => {
  return (
    <div className="text-center py-8 text-gray-500">
      <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 mb-4">{t.noLineup}</p>
      <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />} onPress={onAddPlayer}>
        {t.addPlayer}
      </Button>
    </div>
  );
};

export default LineupEmptyState;
