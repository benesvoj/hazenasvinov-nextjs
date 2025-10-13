import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';

import {
  getOrCreateWallet,
  getBalance,
  getTransactionHistory,
  getWalletSummary,
  addFunds,
  withdrawFunds,
  createTransaction,
} from '@/services';
import {Wallet, Transaction, WalletSummary, CreateTransactionInput} from '@/types';

/**
 * Hook to get or create user's wallet
 */
export function useWallet(userId: string) {
  return useQuery<Wallet | null>({
    queryKey: ['wallet', userId],
    queryFn: () => getOrCreateWallet(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to get wallet balance
 */
export function useWalletBalance(userId: string) {
  return useQuery<number>({
    queryKey: ['wallet', 'balance', userId],
    queryFn: () => getBalance(userId),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 seconds - balance changes frequently
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Hook to get transaction history
 */
export function useTransactionHistory(userId: string, limit: number = 50, offset: number = 0) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', userId, limit, offset],
    queryFn: () => getTransactionHistory(userId, limit, offset),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Hook to get wallet summary with statistics
 */
export function useWalletSummary(userId: string) {
  return useQuery<WalletSummary | null>({
    queryKey: ['wallet', 'summary', userId],
    queryFn: () => getWalletSummary(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({queryKey: ['wallet', variables.user_id]});
      queryClient.invalidateQueries({queryKey: ['wallet', 'balance', variables.user_id]});
      queryClient.invalidateQueries({queryKey: ['transactions', variables.user_id]});
      queryClient.invalidateQueries({queryKey: ['wallet', 'summary', variables.user_id]});
    },
  });
}

/**
 * Hook to add funds to wallet
 */
export function useAddFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      amount,
      description,
    }: {
      userId: string;
      amount: number;
      description?: string;
    }) => addFunds(userId, amount, description),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({queryKey: ['wallet', variables.userId]});
      queryClient.invalidateQueries({queryKey: ['wallet', 'balance', variables.userId]});
      queryClient.invalidateQueries({queryKey: ['transactions', variables.userId]});
      queryClient.invalidateQueries({queryKey: ['wallet', 'summary', variables.userId]});
    },
  });
}

/**
 * Hook to withdraw funds from wallet
 */
export function useWithdrawFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      amount,
      description,
    }: {
      userId: string;
      amount: number;
      description?: string;
    }) => withdrawFunds(userId, amount, description),
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({queryKey: ['wallet', variables.userId]});
      queryClient.invalidateQueries({queryKey: ['wallet', 'balance', variables.userId]});
      queryClient.invalidateQueries({queryKey: ['transactions', variables.userId]});
      queryClient.invalidateQueries({queryKey: ['wallet', 'summary', variables.userId]});
    },
  });
}
