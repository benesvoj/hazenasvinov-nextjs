import {PaymentStatus} from '@/enums/membershipFeeStatus';

import {MembersInternalSchema} from '@/types';

export interface MemberInternal extends Omit<MembersInternalSchema, 'payment_status'> {
  payment_status: PaymentStatus;
}

/**
 * Adapter function to convert database schema to UI type
 */
export function convertToInternalMemberWithPayment(schema: MembersInternalSchema): MemberInternal {
  // Convert string payment_status to enum
  let paymentStatus = PaymentStatus.NOT_REQUIRED;
  if (schema.payment_status === 'paid') paymentStatus = PaymentStatus.PAID;
  else if (schema.payment_status === 'partial') paymentStatus = PaymentStatus.PARTIAL;
  else if (schema.payment_status === 'unpaid') paymentStatus = PaymentStatus.UNPAID;

  return {
    ...schema,
    payment_status: paymentStatus,
  };
}
