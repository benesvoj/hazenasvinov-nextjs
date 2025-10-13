import {Nullish, TransactionStatus, TransactionType} from '@/types';

// Transaction record
export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number; // Positive for credits, negative for debits
  balance_after: number; // Balance after transaction
  description: string;
  reference_id?: string | Nullish; // Related bet_id or other reference
  status: TransactionStatus;
  created_at: string;
  metadata?: Record<string, unknown> | Nullish; // Additional data
}
