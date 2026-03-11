import {Genders, MemberFunction} from '@/enums';
import {Category, MemberInternal, MemberSchema} from '@/types';

export interface Member extends MemberSchema {
  sex: Genders.MALE | Genders.FEMALE;
  functions: MemberFunction[];
}

export interface MembersStatisticTabProps {
  members: MemberInternal[];
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
  gender: Genders.MALE | Genders.FEMALE;
  functions: MemberFunction[];
}

export interface UpdateMemberData {
  id: string;
  name?: string;
  surname?: string;
  registration_number?: string;
  date_of_birth?: string | null;
  gender?: Genders.MALE | Genders.FEMALE;
  functions?: MemberFunction[];
  category_id?: string;
  is_active?: boolean;
}
