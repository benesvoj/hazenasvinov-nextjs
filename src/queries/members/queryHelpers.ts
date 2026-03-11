import {Genders} from '@/enums';
import {GetMembersOptions} from '@/queries/members/types';
import {QueryContext} from '@/queries/shared/types';

/**
 * Builds a paginated Supabase select query against any members view table.
 *
 * Filters are applied only when the corresponding option is present — omitting
 * an option means "no restriction" for that dimension, not "match falsy rows".
 *
 * **`isActive` semantics:**
 * - `isActive === true`             → `WHERE is_active = true` (active members only)
 * - `isActive === false / undefined` → filter not applied (all members returned)
 *
 * Results are always ordered alphabetically by surname then name.
 *
 * @param ctx     - Query context carrying the Supabase client.
 * @param table   - Name of the view/table to query (e.g. `members_internal`).
 * @param options - Pagination, search, and filter options.
 */
export function buildMembersViewQuery(
  ctx: QueryContext,
  table: string,
  options: GetMembersOptions
) {
  const {page = 1, limit = 100, search, sex, memberFunctions, categoryId, isActive} = options;

  let query = ctx.supabase.from(table).select('*', {count: 'exact'});

  if (search?.trim())
    query = query.or(
      `name.ilike.%${search}%,surname.ilike.%${search}%,registration_number.ilike.%${search}%`
    );
  if (isActive) query = query.eq('is_active', true);
  if (sex && sex !== Genders.EMPTY) query = query.eq('sex', sex);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (memberFunctions) query = query.contains('functions', [memberFunctions]);

  query = query.order('surname', {ascending: true}).order('name', {ascending: true});

  const offset = (page - 1) * limit;
  return query.range(offset, offset + limit - 1);
}
