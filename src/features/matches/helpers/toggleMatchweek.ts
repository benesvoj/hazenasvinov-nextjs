/**
 * Toggle the expansion state of a matchweek for a given category.
 * @param prev
 * @param categoryId
 * @param matchweek
 *  @returns A function that takes the previous Set of expanded matchweeks and returns the updated Set.
 */
export const toggleMatchweek = (categoryId: string, matchweek: number) => (prev: Set<string>) => {
  const key = `${categoryId}-${matchweek}`;
  const next = new Set(prev);
  next.has(key) ? next.delete(key) : next.add(key);

  return next;
};
