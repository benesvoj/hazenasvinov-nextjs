import {ClubMemberRelationship} from '../../member/business/clubMemberRelationship';
import {Member} from '../../member/data/member';

export interface LineupPlayer {
  id?: string;
  lineup_id?: string;
  member_id?: string;
  position: string;
  is_captain?: boolean;
  jersey_number?: number;
  goals?: number;
  yellow_cards?: number;
  red_cards_5min?: number;
  red_cards_10min?: number;
  red_cards_personal?: number;
  /* Enhanced player information */
  member?: Member;
  memberClubRelationship?: ClubMemberRelationship;
}
