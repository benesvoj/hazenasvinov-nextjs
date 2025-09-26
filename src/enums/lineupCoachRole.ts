export enum LineupCoachRole {
  HEAD_COACH = 'head_coach',
  ASSISTANT_COACH = 'assistant_coach',
  TEAM_MANAGER = 'team_manager',
}

export const LINEUP_COACH_ROLES_NEW: Record<LineupCoachRole, string> = {
  [LineupCoachRole.HEAD_COACH]: 'Hlavní trenér',
  [LineupCoachRole.ASSISTANT_COACH]: 'Asistent trenéra',
  [LineupCoachRole.TEAM_MANAGER]: 'Vedoucí týmu',
};

export const getLineupCoachRoleOptions = () =>
  Object.entries(LINEUP_COACH_ROLES_NEW).map(([value, label]) => ({
    value: value as LineupCoachRole,
    label,
  }));
