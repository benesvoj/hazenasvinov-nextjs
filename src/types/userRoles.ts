export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'coach';
  created_at: string;
  created_by?: string;
}

export interface CoachCategory {
  id: string;
  user_id: string;
  category_id: string;
  created_at: string;
  created_by?: string;
}

export interface UserRoleSummary {
  user_id: string;
  email: string;
  full_name: string;
  profile_role: string; // Keep for backward compatibility
  roles: string[];
  assigned_categories: string[];
  assigned_category_names: string[];
  assigned_category_codes: string[];
}

export interface RoleAssignment {
  userId: string;
  roles: ('admin' | 'coach')[];
  categories: string[]; // category IDs for coach role
}

export type UserRoleType = 'admin' | 'coach';
