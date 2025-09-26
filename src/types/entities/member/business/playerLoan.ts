export interface PlayerLoan {
  id: string;
  player_id: string;
  from_club_id?: string;
  to_club_id: string;
  loan_start_date: string;
  loan_end_date?: string;
  loan_type: 'temporary' | 'permanent' | 'youth';
  status: 'active' | 'expired' | 'terminated';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PlayerLoanWithDetails extends PlayerLoan {
  player: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  };
  from_club?: {
    id: string;
    name: string;
  };
  to_club: {
    id: string;
    name: string;
  };
}

export interface CreatePlayerLoanData {
  player_id: string;
  from_club_id?: string;
  to_club_id: string;
  loan_start_date: string;
  loan_end_date?: string;
  loan_type: 'temporary' | 'permanent' | 'youth';
  notes?: string;
}

export interface UpdatePlayerLoanData {
  loan_end_date?: string;
  loan_type?: 'temporary' | 'permanent' | 'youth';
  status?: 'active' | 'expired' | 'terminated';
  notes?: string;
}

export interface PlayerLoanFilters {
  player_id?: string;
  club_id?: string;
  status?: 'active' | 'expired' | 'terminated';
  loan_type?: 'temporary' | 'permanent' | 'youth';
  date_from?: string;
  date_to?: string;
}
