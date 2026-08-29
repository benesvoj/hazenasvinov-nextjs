import {translations} from '@/lib/translations';

import {PlayerPosition} from './playerPosition';

export function playerPositionLabels() {
  const t = translations.lineups.enums.playerPosition;
  return {
    [PlayerPosition.FIELD_PLAYER]: t.fieldPlayer,
    [PlayerPosition.GOALKEEPER]: t.goalkeeper,
  };
}

export const getPlayerPositionOptions = () => {
  const labels = playerPositionLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as PlayerPosition,
    label,
  }));
};
