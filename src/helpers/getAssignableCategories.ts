import {Genders} from '@/enums';
import {Category} from '@/types';

/**
 * Categories a member may be moved into, given their sex.
 *
 * A player can only join a category of their own gender — with one exception:
 * mixed categories (přípravky and the younger age groups) take everyone, and a
 * child sitting in one can move on to either the male or the female category.
 * Categories with no gender set are treated as mixed.
 *
 * The member's current category is always kept in the result, even when it
 * breaks the rule or has been archived — dropping it would leave the picker
 * showing nothing and silently misrepresent where the member actually is.
 *
 * @param categories        - Categories available to the current user.
 * @param sex               - Member's sex (`male` / `female`).
 * @param currentCategoryId - Category the member belongs to right now.
 */
export function getAssignableCategories(
  categories: Category[],
  sex: string | null | undefined,
  currentCategoryId?: string | null
): Category[] {
  return categories.filter((category) => {
    if (category.id === currentCategoryId) return true;
    if (category.is_active === false) return false;
    if (!category.gender || category.gender === Genders.MIXED) return true;

    return category.gender === sex;
  });
}
