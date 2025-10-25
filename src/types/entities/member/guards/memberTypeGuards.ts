import {Genders, MemberFunction} from '@/enums';
import {BaseMember, Member} from '@/types';

/**
 *  Check if a value is a valid Genders enum
 */
export function isValidGender(value: any): value is Genders {
  return Object.values(Genders).includes(value);
}

/**
 *  Check if a value is a valid MemberFunction enum
 */
export function isValidMemberFunction(value: any): value is MemberFunction {
  return Object.values(MemberFunction).includes(value);
}

/**
 * Type guard for Member interface
 */
export function isMember(obj: any): obj is Member {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.surname === 'string' &&
    isValidGender(obj.sex) &&
    Array.isArray(obj.functions) &&
    obj.functions.every(isValidMemberFunction)
  );
}

/**
 * Type guard for BaseMember interface
 */
export function isBaseMember(obj: any): obj is BaseMember {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.surname === 'string' &&
    (obj.sex === null || isValidGender(obj.sex))
  );
}

/**
 *  Validate member data from database
 *  Throws error if data is invalid
 */
export function validateMemberFromDb(data: any): asserts data is Member {
  if (!isMember(data)) {
    throw new Error('Invalid member data from database');
  }
}
