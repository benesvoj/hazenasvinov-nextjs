import {Season} from '@/types';

/**
 * Checks if the selected season is closed.
 * @returns {boolean} True if the selected season is closed, false otherwise.
 * @param seasonsArray
 * @param selectedSeasonId
 */
export const isSeasonClosedHelper = (seasonsArray: Season[], selectedSeasonId: string): boolean => {
  const season = seasonsArray.find((s) => s.id === selectedSeasonId);
  return season?.is_closed || false;
};
