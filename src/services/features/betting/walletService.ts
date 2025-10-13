import {createClient} from '@/utils/supabase/client';

import {
  Wallet,
  Transaction,
  CreateTransactionInput,
  WalletSummary,
  TransactionType,
  Currency,
} from '@/types';

/**
 * Wallet Service
 * Manages user wallet balance and transactions for the betting system
 */

const INITIAL_BALANCE = 1000; // Starting balance for new users
const DEFAULT_CURRENCY: Currency = 'POINTS';

/**
 * Get or create wallet for a user
 * @param userId User ID
 * @returns User's wallet
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet | null> {
  const supabase = createClient();

  try {
    // Try to get existing wallet
    const {data: existingWallet, error: fetchError} = await supabase
      .from('betting_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingWallet && !fetchError) {
      return existingWallet;
    }

    // Create new wallet if it doesn't exist
    const {data: newWallet, error: createError} = await supabase
      .from('betting_wallets')
      .insert({
        user_id: userId,
        balance: INITIAL_BALANCE,
        currency: DEFAULT_CURRENCY,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating wallet:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
        userId,
      });
      return null;
    }

    return newWallet;
  } catch (error) {
    console.error('Error in getOrCreateWallet:', {
      error,
      userId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Get current wallet balance
 * @param userId User ID
 * @returns Current balance
 */
export async function getBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWallet(userId);
  return wallet?.balance ?? 0;
}

/**
 * Create a new transaction
 * @param input Transaction input data
 * @returns Created transaction
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction | null> {
  const supabase = createClient();

  try {
    // Get current wallet
    const wallet = await getOrCreateWallet(input.user_id);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Calculate new balance
    const newBalance = wallet.balance + input.amount;

    // Validate balance (prevent negative balance for debit transactions)
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    // Create transaction record
    const {data: transaction, error: transactionError} = await supabase
      .from('betting_transactions')
      .insert({
        user_id: input.user_id,
        wallet_id: wallet.id,
        type: input.type,
        amount: input.amount,
        balance_after: newBalance,
        description: input.description,
        reference_id: input.reference_id,
        status: 'COMPLETED',
        metadata: input.metadata,
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return null;
    }

    // Update wallet balance
    const {error: updateError} = await supabase
      .from('betting_wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', wallet.id);

    if (updateError) {
      console.error('Error updating wallet balance:', updateError);
      // Rollback transaction if wallet update fails
      await supabase.from('betting_transactions').delete().eq('id', transaction.id);
      return null;
    }

    return transaction;
  } catch (error) {
    console.error('Error in createTransaction:', error);
    return null;
  }
}

/**
 * Deduct bet stake from wallet
 * @param userId User ID
 * @param stake Amount to deduct
 * @param betId Reference bet ID
 * @returns Transaction record
 */
export async function deductBetStake(
  userId: string,
  stake: number,
  betId: string
): Promise<Transaction | null> {
  return createTransaction({
    user_id: userId,
    type: 'BET_PLACED',
    amount: -stake, // Negative for debit
    description: `Bet placed`,
    reference_id: betId,
  });
}

/**
 * Credit bet winnings to wallet
 * @param userId User ID
 * @param payout Amount to credit
 * @param betId Reference bet ID
 * @returns Transaction record
 */
export async function creditBetWinnings(
  userId: string,
  payout: number,
  betId: string
): Promise<Transaction | null> {
  return createTransaction({
    user_id: userId,
    type: 'BET_WON',
    amount: payout, // Positive for credit
    description: `Bet won`,
    reference_id: betId,
  });
}

/**
 * Refund void bet to wallet
 * @param userId User ID
 * @param stake Amount to refund
 * @param betId Reference bet ID
 * @returns Transaction record
 */
export async function refundVoidBet(
  userId: string,
  stake: number,
  betId: string
): Promise<Transaction | null> {
  return createTransaction({
    user_id: userId,
    type: 'BET_REFUND',
    amount: stake, // Positive for credit
    description: `Bet refunded (void)`,
    reference_id: betId,
  });
}

/**
 * Get transaction history for a user
 * @param userId User ID
 * @param limit Number of transactions to return
 * @param offset Pagination offset
 * @returns Array of transactions
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const supabase = createClient();

  try {
    const {data, error} = await supabase
      .from('betting_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {ascending: false})
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    return [];
  }
}

/**
 * Get transactions by type
 * @param userId User ID
 * @param type Transaction type
 * @param limit Number of transactions to return
 * @returns Array of transactions
 */
export async function getTransactionsByType(
  userId: string,
  type: TransactionType,
  limit: number = 50
): Promise<Transaction[]> {
  const supabase = createClient();

  try {
    const {data, error} = await supabase
      .from('betting_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', {ascending: false})
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions by type:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTransactionsByType:', error);
    return [];
  }
}

/**
 * Get wallet summary with statistics
 * @param userId User ID
 * @returns Wallet summary
 */
export async function getWalletSummary(userId: string): Promise<WalletSummary | null> {
  const supabase = createClient();

  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) return null;

    // Get all transactions
    const {data: transactions, error} = await supabase
      .from('betting_transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED');

    if (error) {
      console.error('Error fetching transactions for summary:', error);
      return null;
    }

    // Calculate statistics
    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let totalWagered = 0;
    let totalWon = 0;

    transactions?.forEach((tx: Transaction) => {
      switch (tx.type) {
        case 'DEPOSIT':
          totalDeposited += tx.amount;
          break;
        case 'WITHDRAWAL':
          totalWithdrawn += Math.abs(tx.amount);
          break;
        case 'BET_PLACED':
          totalWagered += Math.abs(tx.amount);
          break;
        case 'BET_WON':
          totalWon += tx.amount;
          break;
      }
    });

    const netProfit = totalWon - totalWagered;

    return {
      balance: wallet.balance,
      currency: wallet.currency,
      totalDeposited,
      totalWithdrawn,
      totalWagered,
      totalWon,
      netProfit,
    };
  } catch (error) {
    console.error('Error in getWalletSummary:', error);
    return null;
  }
}

/**
 * Check if user has sufficient balance
 * @param userId User ID
 * @param amount Amount to check
 * @returns True if sufficient balance
 */
export async function hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
  const balance = await getBalance(userId);
  return balance >= amount;
}

/**
 * Add funds to wallet (admin function or for testing)
 * @param userId User ID
 * @param amount Amount to add
 * @param description Transaction description
 * @returns Transaction record
 */
export async function addFunds(
  userId: string,
  amount: number,
  description: string = 'Funds added'
): Promise<Transaction | null> {
  return createTransaction({
    user_id: userId,
    type: 'DEPOSIT',
    amount: amount,
    description: description,
  });
}

/**
 * Withdraw funds from wallet (admin function or for testing)
 * @param userId User ID
 * @param amount Amount to withdraw
 * @param description Transaction description
 * @returns Transaction record
 */
export async function withdrawFunds(
  userId: string,
  amount: number,
  description: string = 'Funds withdrawn'
): Promise<Transaction | null> {
  const hasBalance = await hasSufficientBalance(userId, amount);
  if (!hasBalance) {
    throw new Error('Insufficient balance');
  }

  return createTransaction({
    user_id: userId,
    type: 'WITHDRAWAL',
    amount: -amount, // Negative for debit
    description: description,
  });
}
