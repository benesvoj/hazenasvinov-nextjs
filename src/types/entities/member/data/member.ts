import {Genders, MemberFunction as MemberFunctionEnum} from '@/enums';
import {Category, MemberSchema} from '@/types';

export interface Member extends MemberSchema {
  sex: Genders;
  functions: MemberFunctionEnum[];
}
export interface MembersListTabProps {
  members: Member[];
  categoriesData: Category[] | null;
  functionOptions: Record<string, string>;
  sexOptions: Record<string, string>;
}

export interface MembersStatisticTabProps {
  members: Member[];
  categoriesData: Category[] | null;
}

export interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberCreated: (member: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  }) => void;
  categoryId?: string;
  clubId?: string;
}

export interface MemberFormData {
  name: string;
  surname: string;
  registration_number: string;
  date_of_birth?: string;
  sex: Genders;
  functions: MemberFunctionEnum[];
}

export interface CreateMemberResult {
  id: string;
  name: string;
  surname: string;
  registration_number: string;
}

export interface UpdateMemberData {
  id: string;
  name?: string;
  surname?: string;
  registration_number?: string;
  date_of_birth?: string | null;
  sex?: Genders;
  functions?: MemberFunctionEnum[];
  category_id?: string;
  is_active?: boolean;
}

/**
 * New types for Member to refactor system
 */
export interface MemberNew extends MemberSchema {
  sex: Genders;
  functions: MemberFunctionEnum[];
}
