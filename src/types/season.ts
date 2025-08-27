export interface Season {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_active?: boolean;
    is_closed?: boolean;
    created_at?: string;
    updated_at?: string;
  }