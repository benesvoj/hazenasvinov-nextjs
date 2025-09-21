export interface Member {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  date_of_birth?: string;
  category_id?: string;
  sex: 'male' | 'female';
  functions: string[];
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
  categoriesData: any[] | null;
  functionOptions: Record<string, string>;
  sexOptions: Record<string, string>;
}

export interface MembersStatisticTabProps {
  members: Member[];
  categoriesData: any[] | null;
  functionOptions: Record<string, string>;
}
