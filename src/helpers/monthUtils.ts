import {translations} from '@/lib';

export interface MonthOption {
  value: number;
  label: string;
}

const monthTranslations = translations.common.months;

/**
 * Use in Select dropdowns
 */
export const MONTH_OPTIONS = [
  {value: 1, label: monthTranslations.january},
  {value: 2, label: monthTranslations.february},
  {value: 3, label: monthTranslations.march},
  {value: 4, label: monthTranslations.april},
  {value: 5, label: monthTranslations.may},
  {value: 6, label: monthTranslations.june},
  {value: 7, label: monthTranslations.july},
  {value: 8, label: monthTranslations.august},
  {value: 9, label: monthTranslations.september},
  {value: 10, label: monthTranslations.october},
  {value: 11, label: monthTranslations.november},
  {value: 12, label: monthTranslations.december},
];

/**
 * For display by index (1-12)
 */
export const MONTH_NAMES = [
  monthTranslations.january,
  monthTranslations.february,
  monthTranslations.march,
  monthTranslations.april,
  monthTranslations.may,
  monthTranslations.june,
  monthTranslations.july,
  monthTranslations.august,
  monthTranslations.september,
  monthTranslations.october,
  monthTranslations.november,
  monthTranslations.december,
];

/**
 * Helper to get month name by number
 */
export const getMonthName = (monthNumber: number): string => {
  return MONTH_NAMES[monthNumber - 1] || '';
};
