import {RefereeSchema} from '@/types';

export interface Referee extends RefereeSchema {
  full_name?: string;
}

export interface MatchReferee {
  match_id: string;
  referee_id: string;
  order: 1 | 2;
  referee?: Referee;
}
