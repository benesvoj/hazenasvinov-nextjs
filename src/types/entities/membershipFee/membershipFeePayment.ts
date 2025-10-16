export interface MembershipFeePayment {
  id: string;
  member_id: string;
  category_id: string;
  calendar_year: number;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method?: 'cash' | 'bank_transfer' | 'card' | 'other';
  payment_reference?: string;
  fee_type: 'membership' | 'registration' | 'additional' | 'refund';
  notes?: string;
  receipt_number?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface MemberPaymentStatus {
  member_id: string;
  registration_number: string;
  name: string;
  surname: string;
  category_id: string;
  category_name: string;
  calendar_year: number;
  expected_fee_amount: number;
  total_paid: number;
  net_paid: number;
  payment_status: 'paid' | 'partial' | 'unpaid' | 'not_required';
  last_payment_date?: string;
  payment_count: number;
  currency?: string;
}

export interface CreatePaymentData {
  member_id: string;
  category_id: string;
  calendar_year: number;
  amount: number;
  payment_date: string;
  payment_method?: string;
  payment_reference?: string;
  fee_type?: string;
  notes?: string;
  receipt_number?: string;
}

export interface UpdatePaymentData extends CreatePaymentData {
  id: string;
}

export interface MemberPaymentHistory {
  member: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  };
  payments: MembershipFeePayment[];
  summary: {
    [year: number]: {
      expected: number;
      paid: number;
      status: string;
    };
  };
}
