/**
 * Default member functions when database is not available
 * These are fallback values that ensure the UI works even without database data
 */
export const DEFAULT_MEMBER_FUNCTIONS = {
  'player': 'Hráč',
  'coach': 'Trenér', 
  'referee': 'Rozhodčí',
  'club_management': 'Vedení klubu',
  'assistant_coach': 'Asistent trenéra',
  'team_manager': 'Manažer týmu',
  'physio': 'Fyzioterapeut',
  'doctor': 'Lékař',
  'parent': 'Rodič',
  'volunteer': 'Dobrovolník'
} as const;

/**
 * Member function types for TypeScript
 */
export type MemberFunctionType = keyof typeof DEFAULT_MEMBER_FUNCTIONS;

/**
 * Sex options for members
 */
export const GENDER_OPTIONS = {
  male: "Muž",
  female: "Žena",
} as const;

/**
 * Sex types for TypeScript
 */
export type GenderType = keyof typeof GENDER_OPTIONS;
