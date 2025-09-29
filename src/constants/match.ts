/**
 * @deprecated need to be refactored
 */
export const matchStatuses = {
  upcoming: 'Nadcházející',
  completed: 'Odehráno',
} as const;

/**
 * @deprecated need to be refactored
 */
export const matchStatusesKeys = Object.keys(matchStatuses) as Array<keyof typeof matchStatuses>;
/**
 * @deprecated need to be refactored
 */
export const matchStatusesValues = Object.values(matchStatuses);
