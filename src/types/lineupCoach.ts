import {LineupCoachRoles} from '@/constants';
import {Member} from './member';

export interface LineupCoach {
  id: string;
  lineup_id: string;
  member_id: string;
  role: LineupCoachRoles;
  created_at: string;
  updated_at: string;
  // Extended fields for display
  member?: Member;
  member_name?: string;
  member_surname?: string;
}

export interface LineupCoachFormData {
  member_id: string;
  role: LineupCoachRoles;
}
