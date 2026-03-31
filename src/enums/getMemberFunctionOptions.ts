import {MemberFunction} from './memberFunction';

/**
 * Member function display labels
 */
export function memberFunctionLabels(): Record<MemberFunction, string> {
  return {
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
}

/**
 * Get all member functions as options for UI
 */
export const getMemberFunctionOptions = () => {
  const labels = memberFunctionLabels();
  return Object.entries(labels).map(([value, label]) => ({
    value: value as MemberFunction,
    label,
  }));
};
