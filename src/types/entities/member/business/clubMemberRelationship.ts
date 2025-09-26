import {RelationshipType, RelationshipStatus} from '@/enums';

export interface ClubMemberRelationship {
  id: string;
  member_id: string;
  club_id: string;
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  valid_from: string;
  valid_to?: string;
  notes?: string;
}
