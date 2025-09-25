import {Genders} from '@/enums';
/**
 * Enhanced Category interface for the new category system with URL-friendly routing.
 *
 * This interface extends the base Category with a slug field for better URL handling
 * and removes some optional fields to simplify the core category structure.
 *
 * @property id - Unique UUID identifier (primary key)
 * @property code - Legacy string code for backward compatibility (e.g., 'men', 'women')
 * @property name - Display name in Czech (e.g., 'Muži', 'Ženy')
 * @property description - Optional detailed description
 * @property age_group - Age classification ('adults', 'juniors', 'youth', 'kids')
 * @property gender - Gender classification (Genders enum)
 * @property is_active - Whether category is currently active
 * @property sort_order - Display order in UI
 * @property created_at - Creation timestamp
 * @property updated_at - Last update timestamp
 * @property slug - URL-friendly identifier for routing (e.g., 'men', 'women', 'junior-boys')
 */
export interface Category {
  id: string;
  name: string;
  description?: string;
  age_group?: string;
  gender?: Genders;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  slug?: string;
}
