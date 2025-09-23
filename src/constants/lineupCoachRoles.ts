export const LINEUP_COACH_ROLES = ['head_coach', 'assistant_coach', 'team_manager'] as const;
export type LineupCoachRoles = (typeof LINEUP_COACH_ROLES)[number];

export const LINEUP_COACH_ROLES_OPTIONS = [
  {value: 'head_coach', label: 'Hlavní trenér'},
  {value: 'assistant_coach', label: 'Asistent trenéra'},
  {value: 'team_manager', label: 'Vedoucí týmu'},
];
