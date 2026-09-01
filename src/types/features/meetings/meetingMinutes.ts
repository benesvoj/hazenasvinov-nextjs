/** Read shape of `meeting_minutes`. Nullability mirrors the database. */
export interface MeetingMinutes {
  id: string;
  meeting_number: number;
  meeting_date: string;
  meeting_place?: string | null;
  season_id?: string | null;
  wrote_by?: string | null;
  attachment_url?: string | null;
  attachment_filename?: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by?: string | null;
  updated_by?: string | null;

  // Joined data
  season?: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  } | null;
  wrote_by_user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
  attendees?: MeetingAttendee[];
}

/** Read shape of `meeting_attendees`. Nullability mirrors the database. */
export interface MeetingAttendee {
  id: string;
  meeting_minutes_id: string;
  user_id: string;
  status: 'present' | 'excused';
  notes?: string | null;
  created_at: string | null;
  updated_at: string | null;

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
