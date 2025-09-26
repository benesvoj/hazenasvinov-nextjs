import {translations} from '@/lib/translations';

const t = translations.teamTypes;

export enum TeamTypes {
  HOME = 'home',
  AWAY = 'away',
}

export const TEAM_TYPES_LABELS: Record<TeamTypes, string> = {
  [TeamTypes.HOME]: t.home,
  [TeamTypes.AWAY]: t.away,
};

export const getTeamTypesOptions = () =>
  Object.entries(TEAM_TYPES_LABELS).map(([value, label]) => ({
    value: value as TeamTypes,
    label,
  }));
