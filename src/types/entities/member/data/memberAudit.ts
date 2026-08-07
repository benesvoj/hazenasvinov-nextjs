/**
 * Audit trail of a member record — who created it, who last edited it and when.
 *
 * The `*_by` columns live on `members`; the `*_by_name` fields are resolved
 * from `profiles` by `GET /api/members/[id]` and are `null` when the author is
 * unknown (rows predating the audit trail) or the profile no longer exists.
 */
export interface MemberAudit {
  created_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  updated_at: string | null;
  updated_by: string | null;
  updated_by_name: string | null;
}
