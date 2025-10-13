# Betting System Documentation

## Overview

The betting system is a comprehensive sports betting platform integrated into the Hazenasvinov application. Users can place bets on upcoming matches, track their betting history, and compete on a leaderboard.

## Features

### Core Features
- **Wallet System**: Each user has a virtual wallet with balance management
- **Bet Placement**: Place single bets or accumulator bets on matches
- **Bet Types**: Support for multiple bet types (1X2, Both Teams Score, Over/Under, etc.)
- **Bet History**: Track all active and settled bets
- **Leaderboard**: Compete with other users based on profit, ROI, and win rate
- **Real-time Updates**: Balance and bet status updates in real-time

### Bet Types Supported
1. **1X2** - Match result (Home win, Draw, Away win)
2. **Both Teams to Score** - Will both teams score?
3. **Over/Under** - Total goals over/under threshold
4. **Double Chance** - Cover two of three outcomes
5. **Correct Score** - Predict exact final score
6. **Half-time/Full-time** - Predict both HT and FT results
7. **Handicap** - Asian handicap betting

## Architecture

### Directory Structure
```
src/
├── types/features/betting/
│   ├── bet.ts              # Bet types and interfaces
│   ├── betType.ts          # Bet type definitions
│   ├── wallet.ts           # Wallet and transaction types
│   └── leaderboard.ts      # Leaderboard types
├── services/features/betting/
│   ├── betService.ts       # Bet CRUD operations
│   ├── walletService.ts    # Wallet management
│   └── oddsCalculator.ts   # Odds calculations
├── hooks/features/betting/
│   ├── useBets.ts          # Bet-related hooks
│   ├── useWallet.ts        # Wallet-related hooks
│   └── useLeaderboard.ts   # Leaderboard hooks
├── components/features/betting/
│   ├── BetSlip.tsx         # Bet slip component
│   ├── BetHistory.tsx      # Bet history component
│   ├── MatchBettingCard.tsx # Match betting interface
│   ├── WalletBalance.tsx   # Wallet display
│   └── LeaderboardTable.tsx # Leaderboard display
└── app/(main)/betting/
    └── page.tsx            # Main betting page
```

### Database Schema

#### Tables
1. **wallets** - User wallet balances
2. **transactions** - All financial transactions
3. **bets** - User bets on matches
4. **bet_legs** - Individual selections in bets (for accumulators)
5. **betting_leaderboard** - Materialized view for rankings

#### Key Relationships
- `wallets` → `transactions` (one-to-many)
- `bets` → `bet_legs` (one-to-many)
- `bets` → `matches` (many-to-one via bet_legs)
- `users` → `bets`, `wallets`, `transactions` (one-to-many)

## Installation & Setup

### 1. Database Setup

Run the migration script to create all necessary tables:

```bash
npm run setup:betting
```

This will:
- Create all betting-related tables
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Set up triggers for automatic wallet initialization
- Create materialized view for leaderboard

Alternatively, you can run the SQL file directly in Supabase SQL Editor:
```
scripts/building-app/setup-betting-tables.sql
```

### 2. Environment Variables

Ensure your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Initial Configuration

The system comes with default settings:
- **Initial Balance**: 1000 points per user
- **Currency**: POINTS (virtual currency)
- **Min Stake**: 1 point
- **Max Stake**: 10,000 points
- **Min Odds**: 1.01
- **Max Odds**: 1000

These can be modified in the service files.

## Usage Guide

### For Users

#### Placing a Bet

1. Navigate to `/betting` page
2. Browse upcoming matches
3. Click on odds to add selections to bet slip
4. Choose bet structure (Single or Accumulator)
5. Enter stake amount
6. Review potential return
7. Click "Place Bet"

#### Viewing Bet History

1. Go to "My Bets" tab
2. Filter by:
   - **Active**: Pending bets
   - **Settled**: Won/Lost/Void bets
   - **All**: All bets

#### Checking Leaderboard

1. Go to "Leaderboard" tab
2. View rankings by:
   - Net Profit
   - ROI (Return on Investment)
   - Win Rate
   - Total Bets
3. Filter by period:
   - Daily
   - Weekly
   - Monthly
   - Season
   - All Time

### For Administrators

#### Settling Bets

Bets need to be settled manually or through an automated process after matches complete.

```typescript
import {settleBet} from '@/services/features/betting/betService';

// Settle a bet as won
await settleBet(betId, 'WON');

// Settle a bet as lost
await settleBet(betId, 'LOST');

// Void a bet (refund stake)
await settleBet(betId, 'VOID');
```

#### Managing Wallets

```typescript
import {addFunds, withdrawFunds} from '@/services/features/betting/walletService';

// Add funds to user wallet
await addFunds(userId, 100, 'Bonus credit');

// Withdraw funds
await withdrawFunds(userId, 50, 'Withdrawal');
```

#### Refreshing Leaderboard

The leaderboard is a materialized view that should be refreshed periodically:

```sql
SELECT refresh_betting_leaderboard();
```

Set up a cron job or scheduled function to refresh it regularly (e.g., every hour).

## API Reference

### Services

#### betService

```typescript
// Create a new bet
createBet(input: CreateBetInput): Promise<Bet | null>

// Get bet by ID
getBetById(betId: string): Promise<Bet | null>

// Get user's bets
getUserBets(userId: string, filters?: BetHistoryFilters): Promise<Bet[]>

// Get active bets
getActiveBets(userId: string): Promise<Bet[]>

// Settle a bet
settleBet(betId: string, status: 'WON' | 'LOST' | 'VOID'): Promise<Bet | null>

// Get user statistics
getUserBetStats(userId: string): Promise<UserBetStats | null>
```

#### walletService

```typescript
// Get or create wallet
getOrCreateWallet(userId: string): Promise<Wallet | null>

// Get balance
getBalance(userId: string): Promise<number>

// Create transaction
createTransaction(input: CreateTransactionInput): Promise<Transaction | null>

// Get transaction history
getTransactionHistory(userId: string, limit?: number): Promise<Transaction[]>

// Get wallet summary
getWalletSummary(userId: string): Promise<WalletSummary | null>
```

#### oddsCalculator

```typescript
// Calculate potential return
calculateReturn(stake: number, odds: number): number

// Calculate profit
calculateProfit(stake: number, odds: number): number

// Calculate accumulator odds
calculateAccumulatorOdds(legs: CreateBetLegInput[]): number

// Calculate implied probability
calculateImpliedProbability(odds: number): number

// Convert odds formats
convertToFractional(decimalOdds: number): string
convertToAmerican(decimalOdds: number): string
```

### Hooks

#### useBets

```typescript
// Get user's bets
const { data: bets } = useUserBets(userId, filters);

// Get active bets
const { data: activeBets } = useActiveBets(userId);

// Get user stats
const { data: stats } = useUserBetStats(userId);

// Create bet mutation
const createBet = useCreateBet();
await createBet.mutateAsync(betInput);
```

#### useWallet

```typescript
// Get wallet balance
const { data: balance } = useWalletBalance(userId);

// Get wallet summary
const { data: summary } = useWalletSummary(userId);

// Get transaction history
const { data: transactions } = useTransactionHistory(userId);
```

#### useLeaderboard

```typescript
// Get leaderboard
const { data: leaderboard } = useLeaderboard(period, sortBy);

// Get user rank
const { data: userRank } = useUserRank(userId, period);
```

## Customization

### Adding New Bet Types

1. Add bet type to `betType.ts`:
```typescript
export type BetTypeId = '1X2' | 'NEW_TYPE' | ...;

export const BET_TYPES: Record<BetTypeId, BetTypeMetadata> = {
  NEW_TYPE: {
    id: 'NEW_TYPE',
    name: 'New Bet Type',
    description: 'Description',
    category: 'MAIN',
    availableSelections: ['SELECTION1', 'SELECTION2'],
  },
  // ... other types
};
```

2. Update database constraint in migration:
```sql
ALTER TABLE bet_legs
DROP CONSTRAINT IF EXISTS bet_legs_bet_type_check,
ADD CONSTRAINT bet_legs_bet_type_check
CHECK (bet_type IN ('1X2', 'NEW_TYPE', ...));
```

### Changing Initial Balance

Modify in `walletService.ts`:
```typescript
const INITIAL_BALANCE = 1000; // Change to desired amount
```

### Adjusting Stake Limits

Modify in `betService.ts`:
```typescript
const MIN_STAKE = 1;
const MAX_STAKE = 10000;
```

## Security

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users can only view/modify their own data
- Transactions are logged immutably
- Bet legs are only accessible through parent bets

### Validation

- **Client-side**: Form validation in components
- **Service-side**: Business logic validation in services
- **Database-side**: Constraints and triggers

### Best Practices

1. **Never expose service role key** to client
2. **Validate all inputs** before processing
3. **Use transactions** for multi-step operations
4. **Log all financial transactions**
5. **Audit bet settlements** regularly

## Performance Optimization

### Indexes

All critical queries have indexes:
- User lookups (user_id)
- Status filtering (status)
- Date sorting (placed_at, created_at)
- Composite indexes for common queries

### Caching

React Query handles caching with stale times:
- Balance: 30 seconds
- Bets: 1 minute
- Leaderboard: 5 minutes

### Materialized View

Leaderboard uses materialized view for fast queries. Refresh periodically:
- During low traffic hours
- After major bet settlements
- Every 1-6 hours depending on traffic

## Troubleshooting

### Common Issues

#### 1. "Insufficient balance" error
**Cause**: User doesn't have enough funds
**Solution**: Check wallet balance, add funds if needed

#### 2. Bets not appearing
**Cause**: RLS policies blocking access
**Solution**: Verify user authentication and RLS policies

#### 3. Leaderboard not updating
**Cause**: Materialized view not refreshed
**Solution**: Run `refresh_betting_leaderboard()`

#### 4. Transactions failing
**Cause**: Concurrent updates on wallet
**Solution**: Implement retry logic or transaction locking

### Debug Mode

Enable detailed logging:
```typescript
// In service files
const DEBUG = true;
if (DEBUG) console.log('Debug info:', data);
```

## Testing

### Unit Tests

Test individual functions:
```bash
npm run test
```

### Integration Tests

Test complete flows:
- Create user → Initialize wallet → Place bet → Settle bet

### Manual Testing Checklist

- [ ] User can place single bet
- [ ] User can place accumulator bet
- [ ] Balance updates correctly
- [ ] Transaction history shows all transactions
- [ ] Bet history displays correctly
- [ ] Leaderboard rankings are accurate
- [ ] RLS policies enforce security

## Future Enhancements

### Planned Features
1. **Live Betting**: Bet on matches in progress
2. **Cash Out**: Close bets early for partial payout
3. **Bet Builder**: Create custom bet combinations
4. **Social Features**: Share bets, follow users
5. **Odds Comparison**: Compare odds from multiple sources
6. **Betting Tips**: AI-powered predictions
7. **Notifications**: Real-time bet result notifications
8. **Mobile App**: Native mobile experience

### API Integration
- **Odds Providers**: Integrate real odds from providers
- **Match Data**: Sync with external match APIs
- **Payment Gateways**: For real money betting (if applicable)

## Support

For issues or questions:
1. Check this documentation
2. Review code comments
3. Check database logs
4. Contact development team

## License

Internal use only - Hazenasvinov organization.
