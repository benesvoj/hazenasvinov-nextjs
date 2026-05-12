/**
 * Returns a localized string describing the number of days until an event.
 *
 * @param {number} days - The number of days until the event.
 * @returns string A localized string indicating the time until the event.
 *                   For example, it can return "Dnes!", "Zítra", or "Za X dní".
 */
export const getDaysUntilText = (days: number) => {
  if (days === 0) return 'Dnes!';
  if (days === 1) return 'Zítra';
  if (days <= 4) return `Za ${days} dny`;
  if (days >= 5) return `Za ${days} dní`;
  return `Za ${days} dní`;
};
