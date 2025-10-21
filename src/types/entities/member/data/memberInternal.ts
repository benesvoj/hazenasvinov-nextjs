import {PaymentStatus} from '@/enums/membershipFeeStatus';

import {MembersInternalSchema} from '@/types';

export interface MemberInternal extends Omit<MembersInternalSchema, 'payment_status'> {
  payment_status: PaymentStatus;
}
