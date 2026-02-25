/**
 * Maps weekday names to JavaScript Date.getDay() values.
 */
export const WEEKDAY_MAP: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

/**
 * Generates ISO date strings (YYYY-MM-DD) for all dates in a range
 * that fall on the specified weekdays.
 */
export function generateSessionDates(
  startDate: Date,
  endDate: Date,
  selectedDays: string[]
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const dayName = Object.keys(WEEKDAY_MAP).find((day) => WEEKDAY_MAP[day] === dayOfWeek);

    if (dayName && selectedDays.includes(dayName)) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
