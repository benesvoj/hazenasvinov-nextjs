/**
 * Strips diacritics and lower-cases a string so searches match regardless of
 * accents — "Černý", "cerny" and "ČERNY" all normalise to `cerny`.
 *
 * Must stay in sync with the `search_text` computed field in the database
 * (see `scripts/migrations/20260807_add_unaccented_member_search.sql`), which
 * applies `unaccent(lower(...))` to the stored values. Normalising only one
 * side would make accented rows unreachable.
 *
 * @example
 * normalizeSearchTerm('  Černý ') // 'černý' → 'cerny'
 */
export function normalizeSearchTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
