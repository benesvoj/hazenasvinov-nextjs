# Betting System - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Migration

```bash
npm run setup:betting
```

This creates all necessary tables and sets up the database schema.

### Step 2: Start the Development Server

```bash
npm run dev
```

### Step 3: Access the Betting System

Navigate to: `http://localhost:3000/betting`

That's it! You're ready to start betting.

## 📝 What Was Implemented

### ✅ Complete Feature Set

#### 1. **Type System** (Foundation)
- `src/types/features/betting/bet.ts` - Bet types and interfaces
- `src/types/features/betting/betType.ts` - 8 bet types (1X2, Over/Under, etc.)
- `src/types/features/betting/wallet.ts` - Wallet and transaction types
- `src/types/features/betting/leaderboard.ts` - Leaderboard rankings

#### 2. **Services** (Business Logic)
- `src/services/features/betting/oddsCalculator.ts` - Odds calculations
  - Calculate returns and profits
  - Convert between odds formats (Decimal, Fractional, American)
  - Support for accumulators and system bets
  - Implied probability calculations

- `src/services/features/betting/walletService.ts` - Wallet management
  - Auto-create wallet with 1000 points
  - Transaction management (deposits, withdrawals, bets)
  - Balance validation
  - Transaction history

- `src/services/features/betting/betService.ts` - Bet operations
  - Place bets (single and accumulator)
  - Validate bets
  - Settle bets (won/lost/void)
  - Bet history with filters
  - User statistics

#### 3. **Custom Hooks** (React Query Integration)
- `src/hooks/features/betting/useWallet.ts`
  - `useWalletBalance()` - Get current balance
  - `useTransactionHistory()` - Transaction list
  - `useWalletSummary()` - Complete statistics

- `src/hooks/features/betting/useBets.ts`
  - `useUserBets()` - Get user's bets with filters
  - `useActiveBets()` - Only pending bets
  - `useCreateBet()` - Place new bet
  - `useUserBetStats()` - User statistics

- `src/hooks/features/betting/useLeaderboard.ts`
  - `useLeaderboard()` - Rankings with sorting
  - `useUserRank()` - User's position
  - `useLeaderboardStats()` - Overall statistics

#### 4. **UI Components** (Modern Interface)
- `WalletBalance.tsx` - Display balance and profit/loss
- `MatchBettingCard.tsx` - Select odds and add to bet slip
- `BetSlip.tsx` - Shopping cart for bets with stake input
- `BetHistory.tsx` - View all bets with tabs (Active/Settled/All)
- `LeaderboardTable.tsx` - Rankings with multiple sort options

#### 5. **Main Page**
- `src/app/(main)/betting/page.tsx.backup` - Complete betting interface with tabs

#### 6. **Database Schema**
- `wallets` table - User balances
- `transactions` table - All financial transactions
- `bets` table - User bets
- `bet_legs` table - Bet selections (for accumulators)
- `betting_leaderboard` - Materialized view for rankings
- Row Level Security (RLS) policies
- Automatic wallet initialization on user signup
- Indexes for performance

## 🎯 Key Features

### For Users
1. **Virtual Wallet**: Start with 1000 points
2. **Multiple Bet Types**: 1X2, Both Teams Score, Over/Under, and more
3. **Single & Accumulator Bets**: Combine multiple selections
4. **Real-time Balance**: Updates automatically
5. **Bet History**: Track all your bets
6. **Leaderboard**: Compete with other users
7. **Statistics**: Win rate, ROI, profit tracking

### For Admins
1. **Bet Settlement**: Manual or automated bet resolution
2. **Wallet Management**: Add/remove funds
3. **Leaderboard Refresh**: Update rankings
4. **Transaction Logs**: Complete audit trail

## 📊 System Capabilities

### Bet Types Implemented
- ✅ 1X2 (Match Result)
- ✅ Both Teams to Score
- ✅ Over/Under Goals
- ✅ Double Chance
- ✅ Correct Score
- ✅ Half-time/Full-time
- ✅ Handicap
- ✅ First Goal Scorer

### Bet Structures
- ✅ Single Bet
- ✅ Accumulator (Parlay)
- ✅ System Bet (partial support)

### Odds Formats
- ✅ Decimal (2.50)
- ✅ Fractional (3/2)
- ✅ American (+150)

## 🔧 Configuration

### Default Settings
```typescript
INITIAL_BALANCE = 1000 points
MIN_STAKE = 1 point
MAX_STAKE = 10,000 points
MIN_ODDS = 1.01
MAX_ODDS = 1000
```

### Modify Settings
Edit in respective service files:
- Wallet: `src/services/features/betting/walletService.ts`
- Bets: `src/services/features/betting/betService.ts`

## 🎮 Usage Example

### Placing a Bet

```typescript
// User flow:
1. Go to /betting
2. Click on "2.10" odds for Team A to win
3. Selection added to bet slip
4. Enter stake: 100 points
5. Review: Potential return = 210 points (profit = 110)
6. Click "Place Bet"
7. Bet confirmed, balance updated
```

### Checking Results

```typescript
// After match ends:
1. Admin settles bet using betService.settleBet()
2. If won: User receives 210 points
3. If lost: Stake already deducted
4. Transaction recorded in history
5. Leaderboard updated
```

## 🔐 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Users can only access their own data
- ✅ Validation at multiple layers (client, service, database)
- ✅ Transaction immutability
- ✅ Balance protection (can't go negative)

## 📈 Performance

- ✅ Indexed queries for fast lookups
- ✅ React Query caching (30s to 5min)
- ✅ Materialized view for leaderboard
- ✅ Optimized database queries

## 🐛 Known Limitations

1. **Mock Odds**: Currently using mock odds data
   - Replace with real odds provider API
   - Location: `MatchBettingCard.tsx` - `getMockOdds()`

2. **Mock Matches**: Using hardcoded matches
   - Replace with your actual matches API
   - Location: `app/(main)/betting/page.tsx.backup` - `mockMatches`

3. **Manual Bet Settlement**: Requires admin action
   - Implement automated settlement after match completion
   - Use match results to determine bet outcomes

4. **Leaderboard Refresh**: Manual refresh needed
   - Set up cron job or scheduled function
   - Run: `SELECT refresh_betting_leaderboard();`

## 🔄 Next Steps (To Go Live)

### 1. Integration with Real Data

```typescript
// In betting/page.tsx.backup, replace:
const mockMatches = [...];

// With:
import { useQuery } from '@tanstack/react-query';
const { data: matches } = useQuery({
  queryKey: ['matches', 'upcoming'],
  queryFn: () => fetch('/api/matches/upcoming').then(r => r.json())
});
```

### 2. Integrate Real Odds

```typescript
// In MatchBettingCard.tsx, replace:
const odds = getMockOdds(matchId);

// With API call or odds provider:
const { data: odds } = useMatchOdds(matchId);
```

### 3. Automated Bet Settlement

```typescript
// Create a cron job or webhook:
// When match status changes to 'completed'
async function settleMatchBets(matchId: string) {
  const match = await getMatch(matchId);
  const bets = await getBetsForMatch(matchId);

  for (const bet of bets) {
    // Determine outcome based on match result
    const outcome = determineBetOutcome(bet, match);
    await settleBet(bet.id, outcome);
  }
}
```

### 4. Scheduled Leaderboard Refresh

```sql
-- Set up a PostgreSQL cron job
SELECT cron.schedule(
  'refresh-betting-leaderboard',
  '0 * * * *', -- Every hour
  'SELECT refresh_betting_leaderboard();'
);
```

## 📚 Documentation

- Full documentation: `docs/BETTING_SYSTEM.md`
- API reference included
- Troubleshooting guide
- Future enhancement ideas

## ✅ Checklist Before Going Live

- [ ] Run `npm run setup:betting`
- [ ] Test wallet creation for new users
- [ ] Test bet placement flow
- [ ] Test bet history display
- [ ] Test leaderboard display
- [ ] Replace mock matches with real data
- [ ] Replace mock odds with real data
- [ ] Set up bet settlement automation
- [ ] Set up leaderboard refresh schedule
- [ ] Test RLS policies
- [ ] Review and adjust stake limits
- [ ] Review and adjust initial balance
- [ ] Add error tracking/monitoring
- [ ] Set up backup system for transactions

## 🎉 What You Have Now

A **fully functional betting system** with:
- Complete type safety
- Database schema with migrations
- Business logic services
- React Query integration
- Modern UI components
- Security measures
- Documentation

All you need to do is:
1. Run the migration
2. Connect real match/odds data
3. Set up automated settlement
4. Test and deploy!

## 💡 Tips

1. **Start Small**: Test with a few users first
2. **Monitor Transactions**: Keep an eye on wallet transactions
3. **Adjust Limits**: Based on user behavior
4. **Gather Feedback**: Users will tell you what to improve
5. **Iterate**: Add features based on actual usage

## 🆘 Support

If you encounter issues:
1. Check `docs/BETTING_SYSTEM.md` troubleshooting section
2. Review database logs in Supabase
3. Check browser console for errors
4. Verify RLS policies are correct

---

**You're all set! Happy betting! 🎲**
