// Lineup Manager Types

export interface LineupManagerComponentProps {
  // Core data
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  members: any[];
  categoryId?: string;

  // Callbacks
  onClose?: () => void;
  onMemberCreated?: () => void;
}

export interface LineupTableProps {
  players: any[];
  coaches: any[];
  onEditPlayer: (index: number) => void;
  onDeletePlayer: (index: number) => void;
  onEditCoach: (index: number) => void;
  onDeleteCoach: (index: number) => void;
  getMemberName: (memberId: string) => string;
  t: any;
}

export interface LineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
}

export interface LineupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface LineupSummary {
  total_players: number;
  goalkeepers: number;
  field_players: number;
  coaches: number;
  is_valid: boolean;
}

export interface LineupFormData {
  match_id: string;
  team_id: string;
  is_home_team: boolean;
  players: LineupPlayerFormData[];
  coaches: LineupCoachFormData[];
}

export interface LineupPlayerFormData {
  member_id: string;
  position: string;
  jersey_number?: number;
  goals?: number;
  yellow_cards?: number;
  red_cards_5min?: number;
  red_cards_10min?: number;
  red_cards_personal?: number;
}

export interface LineupCoachFormData {
  member_id: string;
  role: string;
}

export interface LineupManagerRef {
  saveLineup: () => Promise<void>;
}
