import React from 'react';
import {Button} from '@heroui/react';
import {PlusCircleIcon, TrashIcon} from '@heroicons/react/24/solid';
import {ButtonWithTooltip} from '@/components';

interface LineupActionsProps {
  hasPlayersOrCoaches: boolean;
  onAddPlayer: () => void;
  onAddCoach: () => void;
  onDeleteLineup: () => void;
  t: any;
}

const LineupActions: React.FC<LineupActionsProps> = ({
  hasPlayersOrCoaches,
  onAddPlayer,
  onAddCoach,
  onDeleteLineup,
  t,
}) => {
  if (!hasPlayersOrCoaches) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        color="primary"
        startContent={<PlusCircleIcon className="w-4 h-4" />}
        onPress={onAddPlayer}
      >
        {t.addPlayer}
      </Button>
      <Button
        size="sm"
        color="primary"
        startContent={<PlusCircleIcon className="w-4 h-4" />}
        onPress={onAddCoach}
      >
        {t.addCoach}
      </Button>
      <ButtonWithTooltip
        tooltip={t.deleteLineup}
        onPress={onDeleteLineup}
        isIconOnly
        isDanger
        ariaLabel="Remove lineup"
        startContent={<TrashIcon className="w-4 h-4" />}
      />
    </div>
  );
};

export default LineupActions;
