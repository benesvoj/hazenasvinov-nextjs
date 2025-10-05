export type SupabaseUser = {
  id: string;
  email: string;
  updated_at: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    bio?: string;
    position?: string;
    is_blocked?: boolean;
  };
  email_confirmed_at?: string;
};
