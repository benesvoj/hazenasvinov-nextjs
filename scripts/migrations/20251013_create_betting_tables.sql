-- =====================================================
-- Betting System Database Schema
-- Created: 2025-10-13
-- All tables prefixed with "betting_" for easy identification
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BETTING_WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.betting_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 1000.00,
    currency TEXT NOT NULL DEFAULT 'POINTS' CHECK (currency IN ('POINTS', 'USD', 'EUR', 'CZK')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_betting_wallets_user_id ON public.betting_wallets(user_id);

-- Add RLS policies for betting_wallets
ALTER TABLE public.betting_wallets ENABLE ROW LEVEL SECURITY;

-- Users can only view their own wallet
CREATE POLICY "Users can view their own wallet"
    ON public.betting_wallets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only update their own wallet (balance changes through transactions)
CREATE POLICY "Users can update their own wallet"
    ON public.betting_wallets
    FOR UPDATE
    USING (auth.uid() = user_id);

-- System can insert wallets (through trigger)
CREATE POLICY "System can insert wallets"
    ON public.betting_wallets
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- BETTING_TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.betting_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.betting_wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL', 'BET_PLACED', 'BET_WON', 'BET_REFUND', 'ADJUSTMENT')),
    amount NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_betting_transactions_user_id ON public.betting_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_betting_transactions_wallet_id ON public.betting_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_betting_transactions_type ON public.betting_transactions(type);
CREATE INDEX IF NOT EXISTS idx_betting_transactions_reference_id ON public.betting_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_betting_transactions_created_at ON public.betting_transactions(created_at DESC);

-- Add RLS policies for betting_transactions
ALTER TABLE public.betting_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
    ON public.betting_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own transactions (through application)
CREATE POLICY "Users can insert their own transactions"
    ON public.betting_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- BETTING_BETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.betting_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    structure TEXT NOT NULL CHECK (structure IN ('SINGLE', 'ACCUMULATOR', 'SYSTEM')),
    stake NUMERIC(12, 2) NOT NULL CHECK (stake > 0),
    odds NUMERIC(8, 3) NOT NULL CHECK (odds > 0),
    potential_return NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST', 'VOID', 'CANCELLED')),
    system_type TEXT,
    payout NUMERIC(12, 2) DEFAULT 0,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_betting_bets_user_id ON public.betting_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_betting_bets_status ON public.betting_bets(status);
CREATE INDEX IF NOT EXISTS idx_betting_bets_placed_at ON public.betting_bets(placed_at DESC);

-- Add RLS policies for betting_bets
ALTER TABLE public.betting_bets ENABLE ROW LEVEL SECURITY;

-- Users can view their own bets
CREATE POLICY "Users can view their own bets"
    ON public.betting_bets
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own bets
CREATE POLICY "Users can insert their own bets"
    ON public.betting_bets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own bets (limited updates through application)
CREATE POLICY "Users can update their own bets"
    ON public.betting_bets
    FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- BETTING_BET_LEGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.betting_bet_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bet_id UUID NOT NULL REFERENCES public.betting_bets(id) ON DELETE CASCADE,
    match_id TEXT NOT NULL,
    bet_type TEXT NOT NULL,
    selection JSONB NOT NULL,
    odds NUMERIC(8, 3) NOT NULL CHECK (odds > 0),
    parameter JSONB,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'WON', 'LOST', 'VOID')),
    result_determined_at TIMESTAMPTZ,
    home_team TEXT,
    away_team TEXT,
    match_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_betting_bet_legs_bet_id ON public.betting_bet_legs(bet_id);
CREATE INDEX IF NOT EXISTS idx_betting_bet_legs_match_id ON public.betting_bet_legs(match_id);
CREATE INDEX IF NOT EXISTS idx_betting_bet_legs_status ON public.betting_bet_legs(status);

-- Add RLS policies for betting_bet_legs
ALTER TABLE public.betting_bet_legs ENABLE ROW LEVEL SECURITY;

-- Users can view legs of their own bets
CREATE POLICY "Users can view legs of their own bets"
    ON public.betting_bet_legs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.betting_bets
            WHERE betting_bets.id = betting_bet_legs.bet_id
            AND betting_bets.user_id = auth.uid()
        )
    );

-- Users can insert legs for their own bets
CREATE POLICY "Users can insert legs for their own bets"
    ON public.betting_bet_legs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.betting_bets
            WHERE betting_bets.id = betting_bet_legs.bet_id
            AND betting_bets.user_id = auth.uid()
        )
    );

-- Users can update legs of their own bets
CREATE POLICY "Users can update legs of their own bets"
    ON public.betting_bet_legs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.betting_bets
            WHERE betting_bets.id = betting_bet_legs.bet_id
            AND betting_bets.user_id = auth.uid()
        )
    );

-- =====================================================
-- BETTING_LEADERBOARD VIEW (Materialized)
-- =====================================================
-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.betting_leaderboard;

CREATE MATERIALIZED VIEW public.betting_leaderboard AS
SELECT
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as user_name,
    COALESCE(w.balance, 0) as current_balance,
    COALESCE(stats.total_bets, 0) as total_bets,
    COALESCE(stats.won_bets, 0) as won_bets,
    COALESCE(stats.lost_bets, 0) as lost_bets,
    COALESCE(stats.total_wagered, 0) as total_wagered,
    COALESCE(stats.total_winnings, 0) as total_winnings,
    COALESCE(stats.total_winnings - stats.total_wagered, 0) as net_profit,
    CASE
        WHEN COALESCE(stats.total_bets, 0) > 0
        THEN ROUND((COALESCE(stats.won_bets, 0)::NUMERIC / stats.total_bets::NUMERIC) * 100, 2)
        ELSE 0
    END as win_rate,
    CASE
        WHEN COALESCE(stats.total_wagered, 0) > 0
        THEN ROUND((COALESCE(stats.total_winnings - stats.total_wagered, 0)::NUMERIC / stats.total_wagered::NUMERIC) * 100, 2)
        ELSE 0
    END as roi
FROM
    auth.users u
LEFT JOIN
    public.betting_wallets w ON w.user_id = u.id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as total_bets,
        COUNT(*) FILTER (WHERE status = 'WON') as won_bets,
        COUNT(*) FILTER (WHERE status = 'LOST') as lost_bets,
        SUM(stake) as total_wagered,
        SUM(CASE WHEN status = 'WON' THEN potential_return ELSE 0 END) as total_winnings
    FROM
        public.betting_bets
    WHERE
        status IN ('WON', 'LOST')
    GROUP BY
        user_id
) stats ON stats.user_id = u.id
ORDER BY
    net_profit DESC;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_betting_leaderboard_user_id ON public.betting_leaderboard(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for betting_wallets updated_at
DROP TRIGGER IF EXISTS update_betting_wallets_updated_at ON public.betting_wallets;
CREATE TRIGGER update_betting_wallets_updated_at
    BEFORE UPDATE ON public.betting_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for betting_bets updated_at
DROP TRIGGER IF EXISTS update_betting_bets_updated_at ON public.betting_bets;
CREATE TRIGGER update_betting_bets_updated_at
    BEFORE UPDATE ON public.betting_bets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create wallet for new users (OPTIONAL - commented out by default)
-- Uncomment this if you want wallets created automatically on user signup
-- Note: This trigger is likely what's causing the current error
/*
CREATE OR REPLACE FUNCTION public.create_betting_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.betting_wallets (user_id, balance, currency)
    VALUES (NEW.id, 1000.00, 'POINTS');
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create betting wallet for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_betting_wallet_on_user_creation ON auth.users;
CREATE TRIGGER create_betting_wallet_on_user_creation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_betting_wallet_for_new_user();
*/

-- Function to refresh leaderboard (call this periodically or after bet settlements)
CREATE OR REPLACE FUNCTION public.refresh_betting_leaderboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.betting_leaderboard;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.betting_wallets TO authenticated;
GRANT SELECT, INSERT ON public.betting_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.betting_bets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.betting_bet_legs TO authenticated;
GRANT SELECT ON public.betting_leaderboard TO authenticated;

-- Grant execute on refresh function to service_role (for scheduled jobs)
GRANT EXECUTE ON FUNCTION public.refresh_betting_leaderboard() TO service_role;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.betting_wallets IS 'User wallets for betting system';
COMMENT ON TABLE public.betting_transactions IS 'Transaction history for wallet operations';
COMMENT ON TABLE public.betting_bets IS 'User betting history and current bets';
COMMENT ON TABLE public.betting_bet_legs IS 'Individual selections/legs within a bet';
COMMENT ON MATERIALIZED VIEW public.betting_leaderboard IS 'Cached leaderboard data for betting statistics';
COMMENT ON FUNCTION public.refresh_betting_leaderboard() IS 'Refresh the betting leaderboard materialized view';