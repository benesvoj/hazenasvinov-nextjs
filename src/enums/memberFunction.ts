export enum MemberFunction {
  PLAYER = 'player',
  COACH = 'coach',
  REFEREE = 'referee',
  CLUB_MANAGEMENT = 'club_management',
  ASSISTANT_COACH = 'assistant_coach',
  TEAM_MANAGER = 'team_manager',
  PHYSIO = 'physio',
  DOCTOR = 'doctor',
  PARENT = 'parent',
  VOLUNTEER = 'volunteer',
  CONTRIBUTING_MEMBER = 'contributing_member',
}

/**
 * Member function display labels
 */
export const MEMBER_FUNCTION_LABELS: Record<MemberFunction, string> = {
  [MemberFunction.PLAYER]: 'Hráč',
  [MemberFunction.COACH]: 'Trenér',
  [MemberFunction.REFEREE]: 'Rozhodčí',
  [MemberFunction.CLUB_MANAGEMENT]: 'Vedení klubu',
  [MemberFunction.ASSISTANT_COACH]: 'Asistent trenéra',
  [MemberFunction.TEAM_MANAGER]: 'Manažer týmu',
  [MemberFunction.PHYSIO]: 'Fyzioterapeut',
  [MemberFunction.DOCTOR]: 'Lékař',
  [MemberFunction.PARENT]: 'Rodič',
  [MemberFunction.VOLUNTEER]: 'Dobrovolník',
  [MemberFunction.CONTRIBUTING_MEMBER]: 'Přispívající',
};

/**
 * Get all member functions as options for UI
 */
export const getMemberFunctionOptions = () =>
  Object.entries(MEMBER_FUNCTION_LABELS).map(([value, label]) => ({
    value: value as MemberFunction,
    label,
  }));
