import {isNilOrEmpty} from 'ramda-adjunct';

/**
 * Checks if a value is neither null, undefined, nor an empty string/array/object.
 * @param value
 */
export function isNotNilOrEmpty<T>(value: T): value is NonNullable<T> {
  return !isNilOrEmpty(value);
}
