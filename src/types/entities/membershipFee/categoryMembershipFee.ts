export interface CategoryMembershipFee {
  id: string;
  category_id: string;
  calendar_year: number;
  fee_amount: number;
  currency: string;
  fee_period: 'yearly' | 'semester' | 'quarterly' | 'monthly';
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CategoryWithFee {
  id: string;
  name: string;
  current_fee_amount?: number;
  current_fee_period?: string;
  current_fee_currency?: string;
}

export interface CreateCategoryFeeData {
  category_id: string;
  calendar_year: number;
  fee_amount: number;
  currency?: string;
  fee_period?: string;
  description?: string;
}

export interface UpdateCategoryFeeData extends CreateCategoryFeeData {
  id: string;
  is_active?: boolean;
}
