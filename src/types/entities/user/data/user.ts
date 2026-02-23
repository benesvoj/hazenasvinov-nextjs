export interface CreateUserData {
  email: string;
  full_name: string;
  phone?: string;
  bio?: string;
  position?: string;
}

export interface UpdateUserData extends Partial<CreateUserData> {}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  userEmail?: string;
  error?: string;
}

export interface UpdateUserResult {
  success: boolean;
  error?: string;
}

export interface OperationResult {
  success: boolean;
  error?: string;
}
