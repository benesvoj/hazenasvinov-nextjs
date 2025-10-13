import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import {Bet, CreateBetInput, BetHistoryFilters, UserBetStats} from '@/types/features/betting/bet';

import {
  createBet,
  getBetById,
  getUserBets,
  getActiveBets,
  settleBet,
  getUserBetStats,
  cancelBet,
  validateBet,
} from '@/services/features/betting/betService';

/**
 * Hook to get a single bet by ID
 */
export function useBet(betId: string) {
  return useQuery<Bet | null>({
    queryKey: ['bet', betId],
    queryFn: () => getBetById(betId),
    enabled: !!betId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to get user's bets with optional filters
 */
export function useUserBets(
  userId: string,
  filters?: BetHistoryFilters,
  limit: number = 50,
  offset: number = 0
) {
  return useQuery<Bet[]>({
    queryKey: ['bets', userId, filters, limit, offset],
    queryFn: () => getUserBets(userId, filters, limit, offset),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to get user's active (pending) bets
 */
export function useActiveBets(userId: string) {
  return useQuery<Bet[]>({
    queryKey: ['bets', 'active', userId],
    queryFn: () => getActiveBets(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Hook to get user betting statistics
 */
export function useUserBetStats(userId: string) {
  return useQuery<UserBetStats | null>({
    queryKey: ['bets', 'stats', userId],
    queryFn: () => getUserBetStats(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new bet
 */
export function useCreateBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBetInput) => createBet(input),
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({queryKey: ['bets', variables.user_id]});
        queryClient.invalidateQueries({queryKey: ['bets', 'active', variables.user_id]});
        queryClient.invalidateQueries({queryKey: ['bets', 'stats', variables.user_id]});
        queryClient.invalidateQueries({queryKey: ['wallet', 'balance', variables.user_id]});
        queryClient.invalidateQueries({queryKey: ['wallet', 'summary', variables.user_id]});
        queryClient.invalidateQueries({queryKey: ['transactions', variables.user_id]});
      }
    },
  });
}

/**
 * Hook to settle a bet
 */
export function useSettleBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({betId, status}: {betId: string; status: 'WON' | 'LOST' | 'VOID'}) =>
      settleBet(betId, status),
    onSuccess: (data) => {
      if (data) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({queryKey: ['bet', data.id]});
        queryClient.invalidateQueries({queryKey: ['bets', data.user_id]});
        queryClient.invalidateQueries({queryKey: ['bets', 'active', data.user_id]});
        queryClient.invalidateQueries({queryKey: ['bets', 'stats', data.user_id]});
        queryClient.invalidateQueries({queryKey: ['wallet', 'balance', data.user_id]});
        queryClient.invalidateQueries({queryKey: ['wallet', 'summary', data.user_id]});
        queryClient.invalidateQueries({queryKey: ['transactions', data.user_id]});
      }
    },
  });
}

/**
 * Hook to cancel a bet
 */
export function useCancelBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (betId: string) => cancelBet(betId),
    onSuccess: (success, betId) => {
      if (success) {
        // Invalidate all bet queries
        queryClient.invalidateQueries({queryKey: ['bet', betId]});
        queryClient.invalidateQueries({queryKey: ['bets']});
        queryClient.invalidateQueries({queryKey: ['wallet']});
        queryClient.invalidateQueries({queryKey: ['transactions']});
      }
    },
  });
}

/**
 * Hook to validate bet before placing
 * This is a utility hook that doesn't make API calls
 */
export function useValidateBet(input: CreateBetInput | null, userBalance: number) {
  return useQuery({
    queryKey: ['validate-bet', input, userBalance],
    queryFn: () => {
      if (!input) return null;
      return validateBet(input, userBalance);
    },
    enabled: !!input,
    staleTime: 0, // Always revalidate
  });
}
