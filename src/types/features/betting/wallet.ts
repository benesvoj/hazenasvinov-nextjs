// Transaction types
export type TransactionType =
  | 'DEPOSIT' // Add funds
  | 'WITHDRAWAL' // Remove funds
  | 'BET_PLACED' // Deduct bet stake
  | 'BET_WON' // Credit winnings
  | 'BET_REFUND' // Refund void bet
  | 'ADJUSTMENT'; // Manual adjustment

// Transaction status
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

// Currency type (expandable for multi-currency support)
export type Currency = 'POINTS' | 'USD' | 'EUR' | 'CZK';

// Wallet balance information
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: Currency;
  created_at: string;
  updated_at: string;
}

// Transaction creation input
export interface CreateTransactionInput {
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference_id?: string;
  metadata?: Record<string, unknown>;
}

// Wallet summary for UI display
export interface WalletSummary {
  balance: number;
  currency: Currency;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
  netProfit: number; // totalWon - totalWagered
}

// Helper to format currency
export function formatCurrency(amount: number, currency: Currency): string {
  switch (currency) {
    case 'POINTS':
      return `${amount.toFixed(0)} coins`;
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'EUR':
      return `${amount.toFixed(2)}`;
    case 'CZK':
      return `${amount.toFixed(0)} Kč`;
    default:
      return amount.toFixed(2);
  }
}

// Helper to get transaction type color for UI
export function getTransactionTypeColor(
  type: TransactionType
): 'success' | 'danger' | 'warning' | 'default' {
  switch (type) {
    case 'DEPOSIT':
    case 'BET_WON':
    case 'BET_REFUND':
      return 'success';
    case 'WITHDRAWAL':
    case 'BET_PLACED':
      return 'danger';
    case 'ADJUSTMENT':
      return 'warning';
    default:
      return 'default';
  }
}

// Helper to get transaction type label
export function getTransactionTypeLabel(type: TransactionType): string {
  switch (type) {
    case 'DEPOSIT':
      return 'Deposit';
    case 'WITHDRAWAL':
      return 'Withdrawal';
    case 'BET_PLACED':
      return 'Bet Placed';
    case 'BET_WON':
      return 'Bet Won';
    case 'BET_REFUND':
      return 'Bet Refunded';
    case 'ADJUSTMENT':
      return 'Adjustment';
    default:
      return type;
  }
}
