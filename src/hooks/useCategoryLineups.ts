import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { 
  CategoryLineup, 
  CategoryLineupMember, 
  RawCategoryLineupMember,
  CategoryLineupFormData, 
  AddMemberToLineupData,
  CategoryLineupFilters 
} from '@/types/categoryLineup';
import { useUser } from '@/contexts/UserContext';

export function useCategoryLineups() {
  const [lineups, setLineups] = useState<CategoryLineup[]>([]);
  const [lineupMembers, setLineupMembers] = useState<CategoryLineupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useUser();
  const supabase = useMemo(() => createClient(), []);

  // Fetch lineups for a specific category and season
  const fetchLineups = useCallback(async (categoryId: string, seasonId: string) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);


      const { data, error } = await supabase
        .from('category_lineups')
        .select('*')
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });



      if (error) {
        console.error('Database error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      setLineups(data || []);
    } catch (err) {
      console.error('Error fetching lineups:', err);
      
      // Check if it's a table doesn't exist error
      if (err instanceof Error && err.message.includes('relation "category_lineups" does not exist')) {
        console.warn('Category lineups table does not exist. Please run the database setup script.');
        setError('Database tables not set up. Please contact administrator.');
        setLineups([]); // Set empty array instead of throwing
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch lineups');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);

  // Fetch members for a specific lineup
  const fetchLineupMembers = useCallback(async (lineupId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('category_lineup_members')
        .select(`
          *,
          members!inner (
            id,
            name,
            surname,
            registration_number,
            category_id
          )
        `)
        .eq('lineup_id', lineupId)
        .eq('is_active', true)
        .order('jersey_number', { ascending: true });

      if (error) throw error;

      const members: CategoryLineupMember[] = (data || []).map((record: RawCategoryLineupMember) => ({
        id: record.id,
        lineup_id: record.lineup_id,
        member_id: record.member_id,
        position: record.position,
        jersey_number: record.jersey_number,
        is_captain: record.is_captain,
        is_vice_captain: record.is_vice_captain,
        is_active: record.is_active,
        added_at: record.added_at,
        added_by: record.added_by,
        member: {
          id: record.members.id,
          name: record.members.name,
          surname: record.members.surname,
          registration_number: record.members.registration_number,
          category_id: record.members.category_id
        }
      }));

      setLineupMembers(members);
    } catch (err) {
      console.error('Error fetching lineup members:', err);
      
      // Check if it's a table doesn't exist error
      if (err instanceof Error && err.message.includes('relation "category_lineup_members" does not exist')) {
        console.warn('Category lineup members table does not exist. Please run the database setup script.');
        setError('Database tables not set up. Please contact administrator.');
        setLineupMembers([]); // Set empty array instead of throwing
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch lineup members');
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Create a new lineup
  const createLineup = useCallback(async (lineupData: CategoryLineupFormData) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      const { data, error } = await supabase
        .from('category_lineups')
        .insert({
          ...lineupData,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh lineups
      await fetchLineups(lineupData.category_id, lineupData.season_id);
      
      return data;
    } catch (err) {
      console.error('Error creating lineup:', err);
      setError(err instanceof Error ? err.message : 'Failed to create lineup');
      throw err;
    }
  }, [user?.id, supabase, fetchLineups]);

  // Update a lineup
  const updateLineup = useCallback(async (id: string, lineupData: Partial<CategoryLineupFormData>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('category_lineups')
        .update(lineupData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Refresh lineups if category or season changed
      if (lineupData.category_id && lineupData.season_id) {
        await fetchLineups(lineupData.category_id, lineupData.season_id);
      }

      return data;
    } catch (err) {
      console.error('Error updating lineup:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lineup');
      throw err;
    }
  }, [supabase, fetchLineups]);

  // Delete a lineup
  const deleteLineup = useCallback(async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('category_lineups')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setLineups(prev => prev.filter(lineup => lineup.id !== id));
    } catch (err) {
      console.error('Error deleting lineup:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete lineup');
      throw err;
    }
  }, [supabase]);

  // Add member to lineup
  const addMemberToLineup = useCallback(async (lineupId: string, memberData: AddMemberToLineupData) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      const { data, error } = await supabase
        .from('category_lineup_members')
        .insert({
          lineup_id: lineupId,
          member_id: memberData.member_id,
          position: memberData.position,
          jersey_number: memberData.jersey_number,
          is_captain: memberData.is_captain || false,
          is_vice_captain: memberData.is_vice_captain || false,
          is_active: true,
          added_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh lineup members
      await fetchLineupMembers(lineupId);
      
      return data;
    } catch (err) {
      console.error('Error adding member to lineup:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member to lineup');
      throw err;
    }
  }, [user?.id, supabase, fetchLineupMembers]);

  // Remove member from lineup
  const removeMemberFromLineup = useCallback(async (memberId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('category_lineup_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      // Remove from local state
      setLineupMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (err) {
      console.error('Error removing member from lineup:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove member from lineup');
      throw err;
    }
  }, [supabase]);

  // Update member in lineup
  const updateLineupMember = useCallback(async (memberId: string, memberData: Partial<AddMemberToLineupData>) => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('category_lineup_members')
        .update(memberData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;

      // Refresh lineup members
      const member = lineupMembers.find(m => m.id === memberId);
      if (member) {
        await fetchLineupMembers(member.lineup_id);
      }

      return data;
    } catch (err) {
      console.error('Error updating lineup member:', err);
      setError(err instanceof Error ? err.message : 'Failed to update lineup member');
      throw err;
    }
  }, [supabase, lineupMembers, fetchLineupMembers]);

  return {
    lineups,
    lineupMembers,
    loading,
    error,
    setError,
    fetchLineups,
    fetchLineupMembers,
    createLineup,
    updateLineup,
    deleteLineup,
    addMemberToLineup,
    removeMemberFromLineup,
    updateLineupMember
  };
}
