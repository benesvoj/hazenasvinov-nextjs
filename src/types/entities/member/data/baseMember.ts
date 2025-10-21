import {Genders, MemberFunction} from '@/enums';

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
  sex: Genders | null;
  functions: MemberFunction[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
