export interface User {
  id: string;
  email: string;
  raw_user_meta_data: {
    full_name: string;
    bio: string;
    position: string;
    phone: string;
    email_verified: boolean;
  };
  created_at: string;
  updated_at: string;
}