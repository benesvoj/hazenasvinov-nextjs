import {Genders, MemberFunction as MemberFunctionEnum} from '@/enums';
import {Category} from './category';

export interface Member {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  date_of_birth?: string;
  category_id?: string;
  sex: Genders;
  functions: MemberFunctionEnum[];
  // New unified player system fields
  is_external: boolean;
  core_club_id?: string;
  current_club_id?: string;
  external_club_name?: string;
  position?: string;
  jersey_number?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export interface MemberFunction {
  id: string; // Can be either UUID or simple text ID like 'func_player'
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
