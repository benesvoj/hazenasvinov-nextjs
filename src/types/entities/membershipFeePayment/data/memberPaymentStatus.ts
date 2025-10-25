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
  total_refunded: number;
  net_paid: number;
  payment_status: string;
  last_payment_date: string | null;
  payment_count: number;
  currency: string;
}
