import {isNilOrEmpty} from 'ramda-adjunct';

export function isNotNilOrEmpty<T>(value: T): value is NonNullable<T> {
  return !isNilOrEmpty(value);
}
