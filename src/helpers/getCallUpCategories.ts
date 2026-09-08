import {Genders} from '@/enums';
import {Category} from '@/types';

/**
 * Categories a coach may call players up from for a match in `categoryId`.
 *
 * Age is not the boundary — calling up a younger age group is the whole point:
 * the Dorostenci roster in production already holds four Starší žáci, and the
 * coach of the Dorostenky fields Starší žačky and records their goals and
 * cards. Gender is the boundary: a women's team does not call up men. A `mixed`
 * category, or one with no gender set, has no such boundary and sees everyone.
 *
 * Which age group may play up for which is a competition rule that this
 * database does not record, so nothing narrower can be derived from the data.
 * Inactive categories are deliberately kept: Ženy is marked inactive but holds
 * fifteen active players, and dropping them would hide real people from a
 * search the coach is running by name. The list is a starting point the coach
 * searches within, not a ruling on who is eligible.
 *
 * Returns an empty array when the category is unknown, which the caller reads
 * as "no widening possible" and falls back to the single category.
 *
 * @param categories - Categories available to the current user.
 * @param categoryId - Category the match belongs to.
 */
export function getCallUpCategories(
  categories: Category[],
  categoryId?: string | null
): Category[] {
  const own = categories.find((category) => category.id === categoryId);
  if (!own) return [];

  if (!own.gender || own.gender === Genders.MIXED) return categories;

  return categories.filter((category) => category.gender === own.gender);
}
