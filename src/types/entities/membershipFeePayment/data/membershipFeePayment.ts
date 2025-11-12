import {
  MembershipFeePaymentInsert,
  MembershipFeePaymentSchema,
  MembershipFeePaymentUpdate,
} from '@/types';

export interface MembershipFeePayment extends MembershipFeePaymentSchema {}

// Form submission type - excludes fields handled by API (created_by, updated_by)
export interface CreateMembershipFeePayment
  extends Omit<MembershipFeePaymentInsert, 'created_by' | 'updated_by'> {
  created_by?: string | null; // Optional, set by API
  updated_by?: string | null; // Optional, set by API
}

export interface UpdateMembershipFeePayment extends MembershipFeePaymentUpdate {}
