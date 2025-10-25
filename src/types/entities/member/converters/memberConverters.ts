import {PaymentStatus} from '@/enums/membershipFeeStatus';

import {Genders, MemberFunction} from '@/enums';
import {
  Member,
  MemberExternal,
  MemberInternal,
  MemberOnLoan,
  MemberSchema,
  MembersExternalSchema,
  MembersInternalSchema,
  MembersOnLoanSchema,
} from '@/types';

/**
 *  Convert database string to Genders enum
 *  @param sex - Database sex value (string)
 *  @returns Genders enum or null
 */
export function parseGenderFromDb(sex: string | null): Genders | null {
  if (!sex) return null;

  const normalized = sex.toLowerCase().trim();
  switch (normalized) {
    case 'male':
      return Genders.MALE;
    case 'female':
      return Genders.FEMALE;
    case 'mixed':
      return Genders.MIXED;
    default:
      console.warn(`Unknown gender value from DB: ${sex}`);
      return null;
  }
}

/**
 *  Convert database string array to MemberFunction enum array
 *  @param functions - Database functions value (string array[])
 *  @returns MemberFunction enum array
 */
export function parseFunctionsFromDb(functions: string[] | null): MemberFunction[] {
  if (!functions || !functions.length) return [];

  return functions
    .map((f) => {
      const normalized = f.toLowerCase().trim();
      const enumValue = Object.values(MemberFunction).find((v) => v == normalized);

      if (!enumValue) {
        console.warn(`Unknown member function value from DB: ${f}`);
        return null;
      }
      return enumValue as MemberFunction;
    })
    .filter((f): f is MemberFunction => f !== null);
}

/**
 *  Convert MemberSchema (from DB) to Member (application type)
 *  @param schema - Database schema type
 *  @returns Strongly-typed Member
 */
export function convertSchemaToMember(schema: MemberSchema): Member {
  return {
    ...schema,
    sex: parseGenderFromDb(schema.sex) ?? Genders.MALE,
    functions: parseFunctionsFromDb(schema.functions),
  };
}

/**
 *  Convert Member (application type) to MemberSchema (for DB updates)
 *  @param member - Application Member type
 *  @returns Database schema type
 */
export function convertMemberToSchema(member: Member): MemberSchema {
  return {
    ...member,
    sex: member.sex as string,
    functions: member.functions.map((f) => f as string),
  };
}

/**
 * Convert MembersExternalSchema to MemberExternal with enum conversions
 * @param schema - Database schema type for external member
 * @returns MemberExternal with converted enums
 */
export function convertExternalMemberSchema(schema: MembersExternalSchema): MemberExternal {
  return {
    ...schema,
    sex: schema.sex ? parseGenderFromDb(schema.sex) : null,
    functions: schema.functions ? parseFunctionsFromDb(schema.functions) : null,
  };
}

/**
 * Convert MembersOnLoanSchema to MemberOnLoan with enum conversions
 * @param schema - Database schema type for on loan member
 * @returns MemberOnLoan with converted enums
 */
export function convertOnLoanMemberSchema(schema: MembersOnLoanSchema): MemberOnLoan {
  return {
    ...schema,
    sex: schema.sex ? parseGenderFromDb(schema.sex) : null,
    functions: schema.functions ? parseFunctionsFromDb(schema.functions) : null,
  };
}

/**
 *  Convert MembersInternalSchema to MemberInternal with enum conversions and extended payment status
 *  @param schema - Database schema type for internal member
 *  @returns MemberInternal with converted enums and payment status
 */
export function convertToInternalMemberWithPayment(schema: MembersInternalSchema): MemberInternal {
  // Convert string payment_status to enum
  let paymentStatus = PaymentStatus.NOT_REQUIRED;
  if (schema.payment_status === 'paid') paymentStatus = PaymentStatus.PAID;
  else if (schema.payment_status === 'partial') paymentStatus = PaymentStatus.PARTIAL;
  else if (schema.payment_status === 'unpaid') paymentStatus = PaymentStatus.UNPAID;

  return {
    ...schema,
    sex: schema.sex ? (parseGenderFromDb(schema.sex) ?? Genders.MALE) : null,
    functions: schema.functions ? parseFunctionsFromDb(schema.functions) : null,
    payment_status: paymentStatus,
  };
}
