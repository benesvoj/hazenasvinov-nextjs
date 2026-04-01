import {LineupCoachRole} from '@/enums/lineupCoachRole';

export function lineupCoachRolesNew() {
  return {
    [LineupCoachRole.HEAD_COACH]: 'Hlavní trenér',
    [LineupCoachRole.ASSISTANT_COACH]: 'Asistent trenéra',
    [LineupCoachRole.TEAM_MANAGER]: 'Vedoucí týmu',
  };
}

export const getLineupCoachRoleOptions = () => {
  const labels = lineupCoachRolesNew();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as LineupCoachRole,
    label,
  }));
};
