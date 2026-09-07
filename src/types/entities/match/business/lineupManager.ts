import {TeamTypes} from '@/enums';

import {Member} from '../../member/data/member';

import {LineupPlayerFormData} from './lineup';

export interface LineupManagerProps {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  members: Member[];
  categoryId: string;
  /**
   * Otevře manažera na jednom týmu a schová přepínač domácí/hosté. Trenér tak
   * upravuje jen sestavu našeho klubu; admin prop nepředává a dostane obojí.
   */
  lockedTeam?: TeamTypes;
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
