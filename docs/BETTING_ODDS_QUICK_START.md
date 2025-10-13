# Betting Odds System - Quick Start Guide

## 🚀 Getting Started

Your betting odds system is now fully functional! Here's how to start using it.

---

## Step 1: Generate Odds for Your Matches

### Option A: Generate for All Upcoming Matches (Recommended)

```typescript
import {generateOddsForUpcomingMatches} from '@/services';

// Generate odds for matches in next 7 days
const count = await generateOddsForUpcomingMatches(7);
console.log(`Generated odds for ${count} matches`);
```

### Option B: Generate for a Specific Match

```typescript
import {generateAndSaveOdds} from '@/services';

const success = await generateAndSaveOdds({
  match_id: 'your-match-id',
  home_team_id: 'home-team-id',
  away_team_id: 'away-team-id',
  bookmaker_margin: 0.05, // 5% margin
});
```

---

## Step 2: View Odds in UI

The `MatchBettingCard` component automatically displays real odds from the database!

**What you'll see:**
- ✅ Real odds if generated
- ⚠️ Mock odds with warning if not generated
- ⏳ Loading spinner while fetching

**No code changes needed** - it just works!

---

## Step 3: Understand the Odds

### Example Output

For a match between strong home team vs average away team:

```json
{
  "1X2": {
    "1": 2.15,  // Home win (46.5% probability)
    "X": 3.40,  // Draw (29.4% probability)
    "2": 3.20   // Away win (31.2% probability)
  },
  "BOTH_TEAMS_SCORE": {
    "YES": 1.85,
    "NO": 1.95
  },
  "OVER_UNDER": {
    "OVER": 1.90,
    "UNDER": 1.90,
    "line": 2.5
  }
}
```

### How Odds are Calculated

1. **Team Statistics** - Last 15 matches analyzed
   - Win/Draw/Loss rates
   - Goals scored/conceded
   - Home/Away performance
   - Recent form (last 5 matches)

2. **Mathematical Models**
   - **1X2 Odds**: Statistical model with home advantage
   - **Over/Under**: Poisson distribution for goals
   - **BTTS**: Probability both teams score

3. **Bookmaker Margin**
   - Default: 5% (competitive)
   - Adjustable per match
   - Lower = better for users

---

## Common Tasks

### Check if Match Has Odds

```typescript
import {hasOdds} from '@/services';

const hasOddsData = await hasOdds(matchId);
console.log('Has odds:', hasOddsData);
```

### Update Odds for a Match

```typescript
import {updateMatchOdds} from '@/services';

// Regenerate odds (e.g., after team news)
await updateMatchOdds(matchId, homeTeamId, awayTeamId, 0.05);
```

### Lock Odds When Match Starts

```typescript
import {lockOdds} from '@/services';

// Lock odds - no more betting
await lockOdds(matchId);
```

### Get Matches With Odds

```typescript
import {getMatchesWithOdds} from '@/services';

const matchIds = await getMatchesWithOdds(100);
console.log(`${matchIds.length} matches have odds`);
```

---

## Using Hooks in React

### Basic Usage

```typescript
import {useMatchOdds} from '@/hooks';

function MyComponent({matchId}) {
  const {data: odds, isLoading} = useMatchOdds(matchId);

  if (isLoading) return <div>Loading...</div>;
  if (!odds) return <div>No odds available</div>;

  return (
    <div>
      <h3>Match Odds</h3>
      <p>Home: {odds['1X2']['1']}</p>
      <p>Draw: {odds['1X2']['X']}</p>
      <p>Away: {odds['1X2']['2']}</p>
    </div>
  );
}
```

### Generate Odds from UI

```typescript
import {useGenerateOdds} from '@/hooks';

function GenerateOddsButton({match}) {
  const generateOdds = useGenerateOdds();

  const handleClick = () => {
    generateOdds.mutate({
      match_id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      bookmaker_margin: 0.05,
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={generateOdds.isPending}
    >
      {generateOdds.isPending ? 'Generating...' : 'Generate Odds'}
    </button>
  );
}
```

---

## Configuration

### Adjust Bookmaker Margin

```typescript
// More competitive (3%)
await generateAndSaveOdds({
  match_id: matchId,
  home_team_id: homeTeamId,
  away_team_id: awayTeamId,
  bookmaker_margin: 0.03, // 3%
});

// More conservative (10%)
await generateAndSaveOdds({
  match_id: matchId,
  home_team_id: homeTeamId,
  away_team_id: awayTeamId,
  bookmaker_margin: 0.10, // 10%
});
```

### Change Number of Matches Analyzed

Edit `src/services/features/betting/oddsDataCollector.ts`:

```typescript
// Line 16
export async function getTeamStats(
  teamId: string,
  matchLimit: number = 15  // Change this number
): Promise<TeamStats | null>
```

---

## Recommended Workflow

### Daily Routine

```typescript
// Run this once per day (e.g., 6 AM)
async function dailyOddsUpdate() {
  // 1. Generate odds for upcoming matches
  console.log('Generating odds for next 7 days...');
  const count = await generateOddsForUpcomingMatches(7);
  console.log(`✅ Generated odds for ${count} matches`);

  // 2. Get all matches with odds
  const matchIds = await getMatchesWithOdds();
  console.log(`📊 ${matchIds.length} matches have odds`);

  // 3. Lock odds for matches starting soon
  // (implement based on your match times)
}
```

### Before Match Starts

```typescript
// 1. Update odds one last time
await updateMatchOdds(matchId, homeTeamId, awayTeamId);

// 2. Lock odds
await lockOdds(matchId);

// 3. No more betting allowed
```

---

## Troubleshooting

### "Using estimated odds" warning shows

**Cause:** Match doesn't have odds in database

**Solution:**
```typescript
await generateAndSaveOdds({
  match_id: matchId,
  home_team_id: homeTeamId,
  away_team_id: awayTeamId,
});
```

### Odds look unrealistic

**Cause:** Insufficient historical data

**Check:**
```sql
SELECT COUNT(*) FROM matches
WHERE (home_team_id = 'xxx' OR away_team_id = 'xxx')
  AND status = 'completed'
  AND home_score IS NOT NULL;
```

**Need:** At least 10 completed matches per team

### Odds generation fails

**Check console for errors:**
- Team statistics unavailable
- Validation failed
- Database connection issue

**Debug:**
```typescript
const result = await generateMatchOdds({
  match_id: matchId,
  home_team_id: homeTeamId,
  away_team_id: awayTeamId,
});

console.log('Result:', result);
if (result) {
  console.log('Odds:', result.odds);
  console.log('Stats:', result.stats);
}
```

---

## Data Requirements

### Minimum Requirements

For the system to work properly:

✅ At least 10 completed matches per team
✅ Matches have scores (home_score, away_score)
✅ Matches marked as 'completed' status
✅ Teams have valid IDs

### Recommended

🎯 15+ completed matches per team
🎯 Recent matches (last 3-6 months)
🎯 Mix of home and away games
🎯 Competitive matches (similar level opponents)

---

## Performance Tips

### 1. Generate Odds in Advance

```typescript
// Good: Generate once daily
await generateOddsForUpcomingMatches(7);

// Bad: Generate on every page load
```

### 2. Use React Query Caching

The `useMatchOdds` hook automatically caches for 5 minutes.

### 3. Bulk Operations

```typescript
// Good: Bulk generation with delays
await generateOddsForUpcomingMatches(7);

// Bad: Individual generation in tight loop
```

### 4. Database Indexes

Ensure indexes exist (from Phase 1):
```sql
CREATE INDEX idx_betting_odds_match ON betting_odds(match_id);
CREATE INDEX idx_betting_odds_effective ON betting_odds(effective_from, effective_until);
```

---

## Quality Checks

### Validate Generated Odds

```typescript
import {validateOdds} from '@/services';

const odds = await getOddsForMatch(matchId);
if (odds) {
  const validation = validateOdds(odds);

  console.log('Valid:', validation.isValid);
  console.log('Errors:', validation.errors);
  console.log('Margin:', validation.margin);
  console.log('Has Arbitrage:', validation.hasArbitrage);
}
```

### Compare with External Bookmakers

Manually check a few matches against real bookmakers:
- Should be within ±10% of market odds
- Margin should be 3-8% (competitive)
- No arbitrage opportunities

---

## API Quick Reference

### Services

```typescript
// Generate
generateAndSaveOdds(input)
generateOddsForUpcomingMatches(dayLimit)

// Retrieve
getOddsForMatch(matchId)
hasOdds(matchId)
getMatchesWithOdds(limit)

// Update
updateMatchOdds(matchId, homeTeamId, awayTeamId, margin?)

// Lock
lockOdds(matchId)

// Cleanup
deleteOdds(matchId)
```

### Hooks

```typescript
// Query
useMatchOdds(matchId, enabled?)
useHasOdds(matchId)

// Mutations
useGenerateOdds()
useUpdateOdds()
useLockOdds()
```

---

## Next Steps

### Immediate Actions

1. **Generate odds for upcoming matches**
   ```typescript
   await generateOddsForUpcomingMatches(7);
   ```

2. **View in UI**
   - Navigate to betting page
   - See real odds displayed

3. **Test betting flow**
   - Select odds
   - Add to bet slip
   - Place bet

### Future Enhancements (Phase 4)

- [ ] Admin panel for odds management
- [ ] Automated daily generation
- [ ] Odds history tracking
- [ ] Manual odds adjustment UI
- [ ] Analytics dashboard
- [ ] External odds comparison

---

## Resources

### Documentation

- **Phase 2 Details**: `docs/BETTING_ODDS_IMPLEMENTATION.md`
- **Phase 3 Details**: `docs/BETTING_PHASE3_COMPLETE.md`
- **Overall Plan**: `docs/BETTING_ODDS_MANAGEMENT_PLAN.md`
- **Quick Start**: `docs/BETTING_ODDS_QUICK_START.md` (this file)

### Code Locations

- **Services**: `src/services/features/betting/`
- **Hooks**: `src/hooks/features/betting/`
- **Types**: `src/types/features/betting/`
- **UI**: `src/components/features/betting/`

### Example Files

- **Usage Examples**: `src/services/features/betting/oddsGeneratorExample.ts`

---

## Support

### Common Issues

1. **No odds showing** → Generate odds first
2. **Mock odds warning** → Normal if not generated
3. **Generation fails** → Check team data
4. **Unrealistic odds** → Need more historical data

### Getting Help

1. Check console logs for errors
2. Review documentation files
3. Test with example code
4. Verify database tables exist

---

**You're all set!** 🎉

Start by generating odds for your upcoming matches and watch the system come to life!

```typescript
// Run this now!
const count = await generateOddsForUpcomingMatches(7);
console.log(`🎲 Generated odds for ${count} matches!`);
```
