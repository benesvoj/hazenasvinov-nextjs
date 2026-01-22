/**
 * Toggle the expansion state of a matchweek for a given category.
 * @param prev
 * @param categoryId
 * @param matchweek
 *  @returns void
 */
export const toggleMatchweek = (prev: Set<string>, categoryId: string, matchweek: number) => {
  const key = `${categoryId}-${matchweek}`;
  const next = new Set(prev);
  next.has(key) ? next.delete(key) : next.add(key);

  return next;
};
