/**
 * Determines the color code based on the number of days remaining.
 *
 * @param {number} days - The number of days until the target date.
 * @returns string - A string representing the color code:
 *                     'danger' for 0 days (Today),
 *                     'warning' for 1 to 3 days (This week),
 *                     'primary' for 4 to 7 days (Next week),
 *                     'primary' for more than 7 days (Later).
 */
export const getDaysUntilColor = (days: number) => {
  if (days === 0) return 'danger'; // Today
  if (days <= 3) return 'warning'; // This week
  if (days <= 7) return 'primary'; // Next week
  return 'primary'; // Later
};
