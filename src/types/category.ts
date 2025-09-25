import {AgeGroups, CompetitionTypes, Genders} from '@/enums';
import {CategorySeason} from './categorySeason';
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
  age_group?: AgeGroups;
  gender?: Genders;
  is_active?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  slug?: string;
}

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCategory: () => void;
  formData: Category;
  setFormData: (data: Category) => void;
}

export interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCategory: () => void;
  onAddSeason: () => void;
  onEditSeason: (categorySeason: CategorySeason) => void;
  onRemoveSeason: (seasonId: string) => void;
  formData: Category;
  setFormData: (data: Category) => void;
  categorySeasons: CategorySeason[];
}

// Old inteface from categories.tsx
// interface Category {
//   id: string;
//   code: string;
//   name: string;
//   description?: string;
//   age_group?: string;
//   gender?: string;
//   is_active: boolean;
//   sort_order: number;
//   created_at: string;
//   updated_at: string;
//   category_seasons?: CategorySeason[];
// }
