export interface Member {
  id: string;
  registration_number: string;
  name: string;
  surname: string;
  date_of_birth?: string; // Made optional
  category: string; // Legacy field - kept for backward compatibility
  category_id?: string; // New field - foreign key to categories table
  sex: 'male' | 'female';
  functions: string[];
  created_at: string;
  updated_at: string;
}

export interface MemberFunction {
  id: string;
  member_id: string;
  function_id: string;
  season_id: string;
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
