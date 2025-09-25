import {LineupPlayerFormData} from './lineup';
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
  onMemberCreated?: () => void; // Callback when a new member is created
}

export interface LineupManagerRef {
  saveLineup: () => Promise<void>;
}

export interface LineupPlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayerSelected: (player: LineupPlayerFormData) => Promise<void>;
  categoryId?: string;
  editingPlayerIndex?: number | null;
  currentPlayer?: LineupPlayerFormData | null;
  teamName?: string;
  clubId?: string;
  currentLineupPlayers?: LineupPlayerFormData[];
  onMemberCreated?: () => void; // Callback when a new member is created
}
