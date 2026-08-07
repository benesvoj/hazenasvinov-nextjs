/**
 * A member that shares a name with the one being created or edited.
 *
 * Duplicate names are legitimate (namesakes exist, often in different
 * categories), so this is only ever surfaced as a warning — never a block.
 */
export interface MemberDuplicate {
  id: string;
  name: string;
  surname: string;
  registration_number: string | null;
  category_id: string | null;
  is_active: boolean | null;
}
