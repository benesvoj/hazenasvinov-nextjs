/**
 * Base member interface
 * All member types (Member, MemberInternal, MemberExternal, MemberOnLoan)
 * must extend or be compatible with this interface
 */
export interface BaseMember {
  id: string;
  name: string;
  surname: string;
  registration_number: string | null;
  date_of_birth: string | null;
  category_id: string | null;
  sex: string | null;
  functions: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Type guard to check if an object is a BaseMember
 */
export function isBaseMember(obj: any): obj is BaseMember {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.surname === 'string'
  );
}
