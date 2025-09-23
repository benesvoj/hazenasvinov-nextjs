export interface PageVisibility {
  id: string;
  page_key: string;
  page_title: string;
  page_route: string;
  page_description?: string;
  is_visible: boolean;
  sort_order: number;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
