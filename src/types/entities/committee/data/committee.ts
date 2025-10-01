export interface Committee {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
