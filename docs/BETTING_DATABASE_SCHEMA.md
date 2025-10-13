# Betting System Database Schema

## Overview

All betting system tables use the `betting_` prefix for easy identification and isolation from other application tables.

## Tables

### 1. betting_wallets
User wallets for managing betting balances.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → auth.users)
- `balance` (NUMERIC(12,2), Default: 1000.00)
- `currency` (TEXT, Default: 'POINTS')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Unique Constraint:** `user_id`

---

### 2. betting_transactions
Transaction history for all wallet operations.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → auth.users)
- `wallet_id` (UUID, Foreign Key → betting_wallets)
- `type` (TEXT: DEPOSIT, WITHDRAWAL, BET_PLACED, BET_WON, BET_REFUND, ADJUSTMENT)
- `amount` (NUMERIC(12,2))
- `balance_after` (NUMERIC(12,2))
- `description` (TEXT)
- `reference_id` (TEXT, Optional)
- `status` (TEXT: PENDING, COMPLETED, FAILED, CANCELLED)
- `metadata` (JSONB, Optional)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `user_id`
- `wallet_id`
- `type`
- `reference_id`
- `created_at DESC`

---

### 3. betting_bets
Main bets table storing bet information.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → auth.users)
- `structure` (TEXT: SINGLE, ACCUMULATOR, SYSTEM)
- `stake` (NUMERIC(12,2))
- `odds` (NUMERIC(8,3))
- `potential_return` (NUMERIC(12,2))
- `status` (TEXT: PENDING, WON, LOST, VOID, CANCELLED)
- `system_type` (TEXT, Optional)
- `payout` (NUMERIC(12,2), Default: 0)
- `placed_at` (TIMESTAMPTZ)
- `settled_at` (TIMESTAMPTZ, Optional)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `user_id`
- `status`
- `placed_at DESC`

---

### 4. betting_bet_legs
Individual selections/legs within a bet (for accumulators and system bets).

**Columns:**
- `id` (UUID, Primary Key)
- `bet_id` (UUID, Foreign Key → betting_bets)
- `match_id` (TEXT)
- `bet_type` (TEXT)
- `selection` (JSONB)
- `odds` (NUMERIC(8,3))
- `parameter` (JSONB, Optional)
- `status` (TEXT: PENDING, WON, LOST, VOID)
- `result_determined_at` (TIMESTAMPTZ, Optional)
- `home_team` (TEXT, Optional)
- `away_team` (TEXT, Optional)
- `match_date` (TIMESTAMPTZ, Optional)
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- `bet_id`
- `match_id`
- `status`

---

### 5. betting_leaderboard (Materialized View)
Cached leaderboard data for performance.

**Columns:**
- `user_id` (UUID)
- `user_name` (TEXT)
- `current_balance` (NUMERIC)
- `total_bets` (BIGINT)
- `won_bets` (BIGINT)
- `lost_bets` (BIGINT)
- `total_wagered` (NUMERIC)
- `total_winnings` (NUMERIC)
- `net_profit` (NUMERIC)
- `win_rate` (NUMERIC)
- `roi` (NUMERIC)

**Refresh Function:** `refresh_betting_leaderboard()`

---

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### betting_wallets
- Users can SELECT their own wallet
- Users can UPDATE their own wallet
- System can INSERT wallets

### betting_transactions
- Users can SELECT their own transactions
- Users can INSERT their own transactions

### betting_bets
- Users can SELECT their own bets
- Users can INSERT their own bets
- Users can UPDATE their own bets

### betting_bet_legs
- Users can SELECT legs of their own bets
- Users can INSERT legs for their own bets
- Users can UPDATE legs of their own bets

### betting_leaderboard
- All authenticated users can SELECT

---

## Triggers

### Updated At Triggers
- `betting_wallets`: Auto-updates `updated_at` on UPDATE
- `betting_bets`: Auto-updates `updated_at` on UPDATE

### Optional: Auto-Wallet Creation (Commented Out)
A trigger to automatically create a wallet when a new user signs up is available but commented out by default. Wallets are instead created on-demand when users first access the betting system.

---

## Migration File

Location: `scripts/migrations/20251013_create_betting_tables.sql`

To apply the migration:
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of the migration file
3. Execute the SQL

---

## TypeScript Integration

The following service files use these tables:

- **walletService.ts**: Manages `betting_wallets` and `betting_transactions`
- **betService.ts**: Manages `betting_bets` and `betting_bet_legs`
- **useLeaderboard.ts**: Queries `betting_bets` and `betting_leaderboard`

All table references use the `betting_` prefix consistently across the application.
