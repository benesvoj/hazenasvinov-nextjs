import {PaymentStatus} from '@/enums/membershipFeeStatus';

import {Member} from '@/types';

/**
 * Member with payment status information
 * Combines member data with payment status from member_fee_status view
 */
export interface MemberWithPaymentStatus extends Member {
  // Category info (from member_fee_status view)
  category_name: string | null;

  // Payment status (from member_fee_status view)
  payment_status: PaymentStatus;
  expected_fee_amount: number;
  net_paid: number;
  total_paid: number;
  total_refunded: number;
  last_payment_date: string | null;
  payment_count: number;
  calendar_year: number;
  currency: string;
}

export type MemberSortDescriptor = {
  column: string;
  direction: 'ascending' | 'descending';
};
