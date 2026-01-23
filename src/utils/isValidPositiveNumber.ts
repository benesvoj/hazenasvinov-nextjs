import {isNotNil} from 'ramda-adjunct';

import {Nullish} from '@/types';

/**
 * @about Utility function to check if number is a valid positive number
 * @returns boolean
 * @param value
 */
export function isValidPositiveNumber(value: number | Nullish): value is number {
  return isNotNil(value) && value > 0;
}
