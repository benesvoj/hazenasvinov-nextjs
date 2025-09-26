import {translations} from '@/lib/translations';

const t = translations.lineupRole;

export enum LineupRole {
  CAPTAIN = 'captain',
  MEMBER = 'member',
}

export const LINEUP_ROLE_LABELS: Record<LineupRole, string> = {
  [LineupRole.CAPTAIN]: t.captain,
  [LineupRole.MEMBER]: t.member,
};

export const getLineupRoleOptions = () =>
  Object.entries(LINEUP_ROLE_LABELS).map(([value, label]) => ({
    value: value as LineupRole,
    label,
  }));
