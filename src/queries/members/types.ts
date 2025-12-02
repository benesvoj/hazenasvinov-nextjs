import {Member} from '@/types';

/**
 * Member with related data (for joins)
 */
export interface MemberWithRelations extends Member {
  member_functions?: MemberFunction[];
  member_payments?: MemberPayment[];
}

/**
 * Member function join data
 */
export interface MemberFunction {
  function_id: string;
  function_name: string;
  start_date: string;
  end_date?: string;
}

/**
 * Member payment join data
 */
export interface MemberPayment {
  amount: number;
  paid_at: string;
  status: 'paid' | 'pending' | 'overdue';
}

/**
 * Options for querying members
 */
export interface GetMembersOptions {
  isInternal?: boolean;
  isExternal?: boolean;
  onLoan?: boolean;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Member filter options
 */
export interface MemberFilters {
  is_internal?: boolean;
  is_external?: boolean;
  on_loan?: boolean;
  is_active?: boolean;
  category_id?: string;
}
