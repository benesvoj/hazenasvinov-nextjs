import React from 'react';

import {Tabs, Tab} from '@heroui/react';

import {LineupPlayerFormData, LineupCoachFormData} from '@/types';

import CoachesTable from './CoachesTable';
import PlayersTable from './PlayersTable';

interface LineupTabsProps {
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
  onEditPlayer: (index: number) => void;
  onDeletePlayer: (index: number) => void;
  onEditCoach: (index: number) => void;
  onDeleteCoach: (index: number) => void;
  getMemberName: (memberId: string) => string;
  t: any;
}

const LineupTabs: React.FC<LineupTabsProps> = ({
  players,
  coaches,
  onEditPlayer,
  onDeletePlayer,
  onEditCoach,
  onDeleteCoach,
  getMemberName,
  t,
}) => {
  return (
    <div className="space-y-2">
      <Tabs>
        <Tab key="players" title={`${t.players} (${players.length})`}>
          <PlayersTable
            players={players}
            onEditPlayer={onEditPlayer}
            onDeletePlayer={onDeletePlayer}
            getMemberName={getMemberName}
            t={t}
          />
        </Tab>
        <Tab key="coaches" title={`${t.coaches} (${coaches.length})`}>
          <CoachesTable
            coaches={coaches}
            onEditCoach={onEditCoach}
            onDeleteCoach={onDeleteCoach}
            getMemberName={getMemberName}
            t={t}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default LineupTabs;
