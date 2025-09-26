import {RelationshipStatus, RelationshipType} from '@/enums';

export interface MemberClubRelationship {
  id: string;
  member_id: string;
  club_id: string;
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  valid_from: string; // DATE
  valid_to?: string; // DATE
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface MemberClubRelationshipFormData {
  member_id: string;
  club_id: string;
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  valid_from: string;
  valid_to?: string;
  notes?: string;
}

export interface MemberClubRelationshipWithDetails extends MemberClubRelationship {
  member?: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  };
  club?: {
    id: string;
    name: string;
  };
}
