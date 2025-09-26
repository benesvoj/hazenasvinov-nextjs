import {LineupCoachRole} from '@/enums';
import {Member} from './member';

export interface LineupCoach {
  id: string;
  lineup_id: string;
  member_id: string;
  role: LineupCoachRole;
  created_at: string;
  updated_at: string;
  // Extended fields for display
  member?: Member;
  member_name?: string;
  member_surname?: string;
}

export interface LineupCoachFormData {
  member_id: string;
  role: LineupCoachRole;
}
