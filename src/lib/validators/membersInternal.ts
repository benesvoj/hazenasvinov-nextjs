import {z} from 'zod';

import {Genders} from '@/enums/genders';
import {MemberFunction} from '@/enums/memberFunction';

/**
 * Zod schema for validating and coercing query-string parameters received by
 * the `/api/members/internal` GET endpoint.
 *
 * All URL params arrive as strings — coercions are applied where needed:
 * - `page` / `limit`  — coerced from string to integer via `z.coerce.number()`
 * - `isActive`        — `'true'` → `true`, `'false'` → `false` (explicit enum
 *                       prevents accidental truthy coercion of arbitrary strings)
 *
 * Invalid values (e.g. unknown enum member, malformed UUID) are rejected with
 * a 400 response; absent optional fields are left as `undefined`.
 */
export const MembersInternalQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  /** Empty string is rejected (min 1) so absent search ≠ empty-string search. */
  search: z.string().min(1).optional(),
  /** Unknown enum values are rejected to prevent silent no-ops. */
  sex: z.nativeEnum(Genders).optional(),
  /** Malformed UUIDs are rejected early before hitting the DB. */
  category_id: z.string().uuid().optional(),
  function: z.nativeEnum(MemberFunction).optional(),
  /**
   * Active-only flag. Only `'true'` triggers the filter; `'false'` and absent
   * both resolve to `false` (show all members). See `buildMembersViewQuery`.
   */
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

/** Inferred type of a validated `MembersInternalQuerySchema` parse result. */
export type MembersInternalQuery = z.infer<typeof MembersInternalQuerySchema>;
