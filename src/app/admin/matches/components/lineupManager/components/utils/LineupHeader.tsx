import React from 'react';
import {Card, CardHeader} from '@heroui/react';
import {UserGroupIcon} from '@heroicons/react/24/outline';
import {Heading} from '@/components';
import LineupActions from '../LineupActions';

interface LineupHeaderProps {
  currentTeamName: string;
  hasPlayersOrCoaches: boolean;
  onAddPlayer: () => void;
  onAddCoach: () => void;
  onDeleteLineup: () => void;
  t: any;
}

const LineupHeader: React.FC<LineupHeaderProps> = ({
  currentTeamName,
  hasPlayersOrCoaches,
  onAddPlayer,
  onAddCoach,
  onDeleteLineup,
  t,
}) => {
  return (
    <CardHeader className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <UserGroupIcon className="w-5 h-5 text-blue-500" />
        <Heading size={3}>
          {t.lineup}: {currentTeamName}
        </Heading>
      </div>
      <LineupActions
        hasPlayersOrCoaches={hasPlayersOrCoaches}
        onAddPlayer={onAddPlayer}
        onAddCoach={onAddCoach}
        onDeleteLineup={onDeleteLineup}
        t={t}
      />
    </CardHeader>
  );
};

export default LineupHeader;
