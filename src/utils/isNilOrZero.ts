import {isNil} from 'ramda';

import {Nullish} from '@/types';

/**
 * @about Utility function to check if a number is null, undefined, or zero
 * It leverages the 'isNil' function from the 'ramda' library to check for null or undefined values.
 * @returns true if x is null, undefined, or zero; false otherwise
 * @param value  can be a number, null, or undefined
 */
export function isNilOrZero(value: number | Nullish): value is 0 | Nullish {
  return isNil(value) || value === 0;
}
