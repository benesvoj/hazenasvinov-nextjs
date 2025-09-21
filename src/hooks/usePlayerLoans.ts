import {useState, useCallback} from 'react';
import {createClient} from '@/utils/supabase/client';
import {
  PlayerLoan,
  PlayerLoanWithDetails,
  CreatePlayerLoanData,
  UpdatePlayerLoanData,
  PlayerLoanFilters,
} from '@/types/playerLoan';

const supabase = createClient();

export function usePlayerLoans() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get all loans with details
  const getLoans = useCallback(
    async (filters: PlayerLoanFilters = {}): Promise<PlayerLoanWithDetails[]> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from('player_loans').select(`
          *,
          player:members(id, name, surname, registration_number),
          from_club:teams!player_loans_from_club_id_fkey(id, name),
          to_club:teams!player_loans_to_club_id_fkey(id, name)
        `);

        // Apply filters
        if (filters.player_id) {
          query = query.eq('player_id', filters.player_id);
        }
        if (filters.club_id) {
          query = query.or(`from_club_id.eq.${filters.club_id},to_club_id.eq.${filters.club_id}`);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.loan_type) {
          query = query.eq('loan_type', filters.loan_type);
        }
        if (filters.date_from) {
          query = query.gte('loan_start_date', filters.date_from);
        }
        if (filters.date_to) {
          query = query.lte('loan_start_date', filters.date_to);
        }

        const {data, error: fetchError} = await query.order('loan_start_date', {ascending: false});

        if (fetchError) {
          console.error('Error fetching loans:', fetchError);
          throw fetchError;
        }

        return data || [];
      } catch (err) {
        console.error('Error in getLoans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch loans');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get active loans
  const getActiveLoans = useCallback(async (): Promise<PlayerLoanWithDetails[]> => {
    return getLoans({status: 'active'});
  }, [getLoans]);

  // Get loans for a specific player
  const getPlayerLoans = useCallback(
    async (playerId: string): Promise<PlayerLoanWithDetails[]> => {
      return getLoans({player_id: playerId});
    },
    [getLoans]
  );

  // Get loans for a specific club
  const getClubLoans = useCallback(
    async (clubId: string): Promise<PlayerLoanWithDetails[]> => {
      return getLoans({club_id: clubId});
    },
    [getLoans]
  );

  // Create a new loan
  const createLoan = useCallback(
    async (loanData: CreatePlayerLoanData): Promise<PlayerLoan | null> => {
      try {
        setLoading(true);
        setError(null);

        const {data, error: createError} = await supabase.rpc('create_player_loan', {
          p_player_id: loanData.player_id,
          p_from_club_id: loanData.from_club_id || null,
          p_to_club_id: loanData.to_club_id,
          p_loan_start_date: loanData.loan_start_date,
          p_loan_end_date: loanData.loan_end_date || null,
          p_loan_type: loanData.loan_type,
          p_notes: loanData.notes || null,
        });

        if (createError) {
          console.error('Error creating loan:', createError);
          throw createError;
        }

        // Fetch the created loan with details
        const {data: loanDetails, error: fetchError} = await supabase
          .from('player_loans')
          .select(
            `
          *,
          player:members(id, name, surname, registration_number),
          from_club:teams!player_loans_from_club_id_fkey(id, name),
          to_club:teams!player_loans_to_club_id_fkey(id, name)
        `
          )
          .eq('id', data)
          .single();

        if (fetchError) {
          console.error('Error fetching created loan:', fetchError);
          throw fetchError;
        }

        return loanDetails;
      } catch (err) {
        console.error('Error in createLoan:', err);
        setError(err instanceof Error ? err.message : 'Failed to create loan');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // End a loan
  const endLoan = useCallback(async (loanId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const {error: endError} = await supabase.rpc('end_player_loan', {
        p_loan_id: loanId,
      });

      if (endError) {
        console.error('Error ending loan:', endError);
        throw endError;
      }

      return true;
    } catch (err) {
      console.error('Error in endLoan:', err);
      setError(err instanceof Error ? err.message : 'Failed to end loan');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a loan
  const updateLoan = useCallback(
    async (loanId: string, updateData: UpdatePlayerLoanData): Promise<PlayerLoan | null> => {
      try {
        setLoading(true);
        setError(null);

        const {data, error: updateError} = await supabase
          .from('player_loans')
          .update(updateData)
          .eq('id', loanId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating loan:', updateError);
          throw updateError;
        }

        return data;
      } catch (err) {
        console.error('Error in updateLoan:', err);
        setError(err instanceof Error ? err.message : 'Failed to update loan');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get loan statistics
  const getLoanStats = useCallback(
    async (
      clubId?: string
    ): Promise<{
      total_loans: number;
      active_loans: number;
      expired_loans: number;
      loaned_in: number;
      loaned_out: number;
    }> => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from('player_loans').select('status, from_club_id, to_club_id');

        if (clubId) {
          query = query.or(`from_club_id.eq.${clubId},to_club_id.eq.${clubId}`);
        }

        const {data, error: fetchError} = await query;

        type LoanStatsData = {
          status: string;
          from_club_id: string | null;
          to_club_id: string | null;
        };

        if (fetchError) {
          console.error('Error fetching loan stats:', fetchError);
          throw fetchError;
        }

        const stats = {
          total_loans: data?.length || 0,
          active_loans: data?.filter((loan: LoanStatsData) => loan.status === 'active').length || 0,
          expired_loans:
            data?.filter((loan: LoanStatsData) => loan.status === 'expired').length || 0,
          loaned_in: data?.filter((loan: LoanStatsData) => loan.to_club_id === clubId).length || 0,
          loaned_out:
            data?.filter((loan: LoanStatsData) => loan.from_club_id === clubId).length || 0,
        };

        return stats;
      } catch (err) {
        console.error('Error in getLoanStats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch loan statistics');
        return {
          total_loans: 0,
          active_loans: 0,
          expired_loans: 0,
          loaned_in: 0,
          loaned_out: 0,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getLoans,
    getActiveLoans,
    getPlayerLoans,
    getClubLoans,
    createLoan,
    endLoan,
    updateLoan,
    getLoanStats,
  };
}
