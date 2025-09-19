export interface MemberMetadata {
  id: string;
  member_id: string;

  // Contact Information
  phone?: string;
  email?: string;
  address?: string;

  // Parent/Guardian Information
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;

  // Medical Information
  medical_notes?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;

  // Additional Information
  notes?: string;
  preferred_position?: string;
  jersey_size?: string;
  shoe_size?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface MemberWithMetadata {
  // Member fields
  id: string;
  name: string;
  surname: string;
  registration_number: string;
  date_of_birth: string;
  sex: 'male' | 'female';
  functions?: string;
  category_id: string;
  created_at: string;
  updated_at: string;

  // Metadata fields
  phone?: string;
  email?: string;
  address?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  medical_notes?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  preferred_position?: string;
  jersey_size?: string;
  shoe_size?: string;

  // Category fields
  category_name?: string;
  category_code?: string;
}

export interface MemberFormData {
  // Basic Information
  name: string;
  surname: string;
  registration_number: string;
  date_of_birth: string;
  sex: 'male' | 'female';
  functions: string;

  // Contact Information
  phone: string;
  email: string;
  address: string;

  // Parent/Guardian Information
  parent_name: string;
  parent_phone: string;
  parent_email: string;

  // Medical Information
  medical_notes: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;

  // Additional Information
  notes: string;
  preferred_position: string;
  jersey_size: string;
  shoe_size: string;
}
