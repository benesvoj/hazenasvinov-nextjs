import React from 'react';

import {CardBody} from '@heroui/react';

import {LoadingSpinner} from '@/components';
import {LineupPlayerFormData, LineupCoachFormData} from '@/types';

import LineupEmptyState from '../LineupEmptyState';
import LineupTabs from '../LineupTabs';

interface LineupContentProps {
  loading: boolean;
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
  onAddPlayer: () => void;
  onEditPlayer: (index: number) => void;
  onDeletePlayer: (index: number) => void;
  onEditCoach: (index: number) => void;
  onDeleteCoach: (index: number) => void;
  getMemberName: (memberId: string) => string;
  t: any;
}

const LineupContent: React.FC<LineupContentProps> = ({
  loading,
  players,
  coaches,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer,
  onEditCoach,
  onDeleteCoach,
  getMemberName,
  t,
}) => {
  if (loading) {
    return (
      <CardBody>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner label={t.loading} />
        </div>
      </CardBody>
    );
  }

  if (players.length === 0 && coaches.length === 0) {
    return (
      <CardBody>
        <LineupEmptyState onAddPlayer={onAddPlayer} t={t} />
      </CardBody>
    );
  }

  return (
    <CardBody>
      <LineupTabs
        players={players}
        coaches={coaches}
        onEditPlayer={onEditPlayer}
        onDeletePlayer={onDeletePlayer}
        onEditCoach={onEditCoach}
        onDeleteCoach={onDeleteCoach}
        getMemberName={getMemberName}
        t={t}
      />
    </CardBody>
  );
};

export default LineupContent;
