/**
 * Gender options
 */

export const GENDER_OPTIONS = {
  male: "Muž",
  female: "Žena",
  empty: "Ostatní",
  mixed: "Smíšený",
} as const;

export type GenderType = keyof typeof GENDER_OPTIONS;