import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {MeetingMinutes, MeetingMinutesFilters, MeetingAttendee} from '@/types';

export function useMeetingMinutes() {
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinutes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetingMinutes = useCallback(async (filters: MeetingMinutesFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      let query = supabase
        .from('meeting_minutes')
        .select(
          `
          *,
          season:seasons (
            id,
            name,
            start_date,
            end_date
          ),
          attendees:meeting_attendees (
            id,
            user_id,
            status,
            notes
          )
        `
        )
        .eq('is_active', true)
        .order('meeting_date', {ascending: false});

      // Apply filters
      if (filters.season_id) {
        query = query.eq('season_id', filters.season_id);
      }

      if (filters.wrote_by) {
        query = query.eq('wrote_by', filters.wrote_by);
      }

      if (filters.meeting_date_from) {
        query = query.gte('meeting_date', filters.meeting_date_from);
      }

      if (filters.meeting_date_to) {
        query = query.lte('meeting_date', filters.meeting_date_to);
      }

      if (filters.search) {
        query = query.or(`meeting_place.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      const {data, error} = await query;

      if (error) throw error;

      // Fetch user data for wrote_by (still using users for who wrote the minutes)
      const wroteByUserIds = new Set<string>();
      data?.forEach((item: MeetingMinutes) => {
        if (item.wrote_by) wroteByUserIds.add(item.wrote_by);
      });

      let wroteByUsersData: any[] = [];
      if (wroteByUserIds.size > 0) {
        try {
          const response = await fetch('/api/get-users');
          const usersResponse = await response.json();
          const allUsers = Array.isArray(usersResponse) ? usersResponse : usersResponse.users || [];
          wroteByUsersData = allUsers.filter((user: any) =>
            Array.from(wroteByUserIds).includes(user.id)
          );
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }

      // Fetch members data for attendees
      const memberIds = new Set<string>();
      data?.forEach((item: MeetingMinutes) => {
        item.attendees?.forEach((attendee) => {
          if (attendee.user_id) memberIds.add(attendee.user_id);
        });
      });

      let membersData: any[] = [];
      if (memberIds.size > 0) {
        try {
          const {data: members, error: membersError} = await supabase
            .from('members')
            .select('id, name, surname, registration_number')
            .in('id', Array.from(memberIds));

          if (!membersError && members) {
            membersData = members;
          }
        } catch (error) {
          console.error('Error fetching members:', error);
        }
      }

      // Transform the data to include user and member information
      const transformedData =
        data?.map((item: MeetingMinutes) => ({
          ...item,
          wrote_by_user: wroteByUsersData.find((u) => u.id === item.wrote_by) || null,
          attendees:
            item.attendees?.map((attendee: MeetingAttendee) => ({
              ...attendee,
              member: membersData.find((m) => m.id === attendee.user_id) || null,
            })) || [],
        })) || [];

      setMeetingMinutes(transformedData);
    } catch (err: any) {
      console.error('Error fetching meeting minutes:', err);
      setError(err?.message || 'Chyba při načítání zápisů');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMeetingMinutes = useCallback(
    async (formData: any) => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Create meeting minutes
        const {data: meetingData, error: meetingError} = await supabase
          .from('meeting_minutes')
          .insert({
            meeting_number: formData.meeting_number,
            meeting_date: formData.meeting_date,
            meeting_place: formData.meeting_place || null,
            season_id: formData.season_id || null,
            wrote_by: formData.wrote_by || null,
            attachment_url: formData.attachment_url || null,
            attachment_filename: formData.attachment_filename || null,
            is_active: true,
          })
          .select()
          .single();

        if (meetingError) {
          console.error('Meeting minutes creation error:', meetingError);
          throw new Error(`Chyba při vytváření zápisu: ${meetingError.message}`);
        }

        // Create attendees if any
        if (formData.attendees && formData.attendees.length > 0) {
          const attendeesData = formData.attendees
            .filter((attendee: any) => attendee.user_id) // Only include attendees with valid user_id
            .map((attendee: any) => ({
              meeting_minutes_id: meetingData.id,
              user_id: attendee.user_id,
              status: attendee.status,
              notes: attendee.notes || null,
            }));

          const {error: attendeesError} = await supabase
            .from('meeting_attendees')
            .insert(attendeesData);

          if (attendeesError) {
            console.error('Attendees creation error:', attendeesError);
            throw new Error(`Chyba při vytváření účastníků: ${attendeesError.message}`);
          }
        }

        // Refresh the list
        await fetchMeetingMinutes();

        return meetingData;
      } catch (err: any) {
        console.error('Error creating meeting minutes:', err);
        setError(err?.message || 'Chyba při vytváření zápisu');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMeetingMinutes]
  );

  const updateMeetingMinutes = useCallback(
    async (id: string, formData: any) => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Update meeting minutes
        const {data: meetingData, error: meetingError} = await supabase
          .from('meeting_minutes')
          .update({
            meeting_number: formData.meeting_number,
            meeting_date: formData.meeting_date,
            meeting_place: formData.meeting_place || null,
            season_id: formData.season_id || null,
            wrote_by: formData.wrote_by,
            attachment_url: formData.attachment_url || null,
            attachment_filename: formData.attachment_filename || null,
          })
          .eq('id', id)
          .select()
          .single();

        if (meetingError) throw meetingError;

        // Update attendees - first delete existing, then insert new
        if (formData.attendees) {
          // Delete existing attendees
          await supabase.from('meeting_attendees').delete().eq('meeting_minutes_id', id);

          // Insert new attendees
          if (formData.attendees.length > 0) {
            const attendeesData = formData.attendees.map((attendee: any) => ({
              meeting_minutes_id: id,
              user_id: attendee.user_id,
              status: attendee.status,
              notes: attendee.notes || null,
            }));

            const {error: attendeesError} = await supabase
              .from('meeting_attendees')
              .insert(attendeesData);

            if (attendeesError) throw attendeesError;
          }
        }

        // Refresh the list
        await fetchMeetingMinutes();

        return meetingData;
      } catch (err: any) {
        console.error('Error updating meeting minutes:', err);
        setError(err?.message || 'Chyba při aktualizaci zápisu');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMeetingMinutes]
  );

  const deleteMeetingMinutes = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();

        // Delete meeting minutes (attendees will be deleted automatically due to CASCADE)
        const {error} = await supabase.from('meeting_minutes').delete().eq('id', id);

        if (error) throw error;

        // Refresh the list
        await fetchMeetingMinutes();
      } catch (err: any) {
        console.error('Error deleting meeting minutes:', err);
        setError(err?.message || 'Chyba při mazání zápisu');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMeetingMinutes]
  );

  const getNextMeetingNumber = useCallback(async (year: number) => {
    try {
      const supabase = createClient();

      const {data, error} = await supabase
        .from('meeting_minutes')
        .select('meeting_number')
        .gte('meeting_date', `${year}-01-01`)
        .lt('meeting_date', `${year + 1}-01-01`)
        .order('meeting_number', {ascending: false})
        .limit(1);

      if (error) throw error;

      return data && data.length > 0 ? data[0].meeting_number + 1 : 1;
    } catch (err: any) {
      console.error('Error getting next meeting number:', err);
      return 1;
    }
  }, []);

  return {
    meetingMinutes,
    loading,
    error,
    fetchMeetingMinutes,
    createMeetingMinutes,
    updateMeetingMinutes,
    deleteMeetingMinutes,
    getNextMeetingNumber,
  };
}
