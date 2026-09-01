import {ClubMemberRelationship} from '../../member/business/clubMemberRelationship';
import {Member} from '../../member/data/member';

export interface LineupPlayer {
  id?: string;
  lineup_id?: string;
  member_id?: string;
  position: string;
  is_captain?: boolean | null;
  jersey_number?: number | null;
  goals?: number | null;
  yellow_cards?: number | null;
  red_cards_5min?: number | null;
  red_cards_10min?: number | null;
  red_cards_personal?: number | null;
  /* Enhanced player information */
  member?: Member;
  memberClubRelationship?: ClubMemberRelationship;
}
