import {Club, Team} from '@/types';

export interface ClubWithTeams extends Club {
  teams: Team[];
}
