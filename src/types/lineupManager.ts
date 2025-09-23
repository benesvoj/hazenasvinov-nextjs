import {Member} from './member';

export interface LineupManagerProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  members: Member[];
  categoryId: string;
  onClose?: () => void;
}

export interface LineupManagerRef {
  saveLineup: () => Promise<void>;
}
