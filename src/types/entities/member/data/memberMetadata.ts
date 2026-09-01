import {Genders} from '@/enums';

/** Read shape of `member_metadata`. Nullability mirrors the database. */
export interface MemberMetadata {
  id: string;
  member_id: string;

  // Contact Information
  phone: string | null;
  email: string | null;
  address: string | null;

  // Parent/Guardian Information
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;

  // Medical Information
  medical_notes: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;

  // Additional Information
  notes: string | null;
  preferred_position: string | null;
  jersey_size: string | null;
  shoe_size: string | null;

  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Read shape of the `members_with_metadata` view. Every column is nullable because
 * Postgres cannot prove otherwise through the view's joins, and `functions` is a
 * text array, not a string. There is no `category_code` column.
 */
export interface MemberWithMetadata {
  // Member fields
  id: string | null;
  name: string | null;
  surname: string | null;
  registration_number: string | null;
  date_of_birth: string | null;
  sex: string | null;
  functions: string[] | null;
  category_id: string | null;
  created_at: string | null;
  updated_at: string | null;

  // Metadata fields
  phone: string | null;
  email: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  medical_notes: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  preferred_position: string | null;
  jersey_size: string | null;
  shoe_size: string | null;

  // Category fields
  category_name: string | null;
}

/**
 *  @description Form data structure for member metadata, including personal, contact, medical, and additional information. Old name MemberFormData conflicts with another interface.
 *  @interface MemberMetadataFormData
 *
 */
export interface MemberMetadataFormData {
  // Basic Information
  name: string;
  surname: string;
  registration_number: string;
  date_of_birth: string;
  sex: Genders.MALE | Genders.FEMALE;
  functions: string;
  category_id: string;

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
