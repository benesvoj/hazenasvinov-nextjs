import {translations} from '@/lib/translations';

const t = translations.playerPosition;

export enum PlayerPosition {
  FIELD_PLAYER = 'field_player',
  GOALKEEPER = 'goalkeeper',
}

export const PLAYER_POSITION_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.FIELD_PLAYER]: t.fieldPlayer,
  [PlayerPosition.GOALKEEPER]: t.goalkeeper,
};

export const getPlayerPositionOptions = () =>
  Object.entries(PLAYER_POSITION_LABELS).map(([value, label]) => ({
    value: value as PlayerPosition,
    label,
  }));
