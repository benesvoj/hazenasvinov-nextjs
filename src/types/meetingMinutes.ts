export interface MeetingMinutes {
  id: string;
  meeting_number: number;
  meeting_date: string;
  meeting_place?: string;
  season_id?: string;
  wrote_by?: string;
  attachment_url?: string;
  attachment_filename?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Joined data
  season?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  };
  wrote_by_user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  attendees?: MeetingAttendee[];
}

export interface MeetingAttendee {
  id: string;
  meeting_minutes_id: string;
  user_id: string;
  status: 'present' | 'excused';
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  member?: {
    id: string;
    name: string;
    surname: string;
    registration_number: string;
  };
}

export interface MeetingMinutesFormData {
  meeting_number: number;
  meeting_date: string;
  meeting_place: string;
  season_id: string;
  wrote_by: string;
  attachment_url: string;
  attachment_filename: string;
  attendees: MeetingAttendeeFormData[];
}

export interface MeetingAttendeeFormData {
  user_id: string;
  status: 'present' | 'excused';
  notes: string;
}

export interface MeetingMinutesFilters {
  season_id?: string;
  wrote_by?: string;
  meeting_date_from?: string;
  meeting_date_to?: string;
  search?: string;
}

export interface MeetingMinutesStats {
  total_meetings: number;
  meetings_this_year: number;
  meetings_this_season: number;
  total_attendees: number;
  average_attendance: number;
}

