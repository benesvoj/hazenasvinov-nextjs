# Betting Odds System - Phase 2 Implementation

## Overview

Phase 2 of the odds management system has been implemented, providing automated odds generation based on historical team statistics and Poisson distribution models.

---

## What's Implemented

### 1. Type System (`src/types/features/betting/odds.ts`)

Complete TypeScript types for the odds system:
- `Odds` - Individual odds entry
- `OddsHistory` - Historical odds tracking
- `MatchOdds` - Structured odds for a match
- `TeamStats` - Team statistics for calculations
- `MatchProbabilities` - Calculated probabilities
- `OddsGenerationInput` - Input parameters
- `OddsGenerationResult` - Complete generation output
- `OddsValidationResult` - Validation results

### 2. Data Collection Service (`src/services/features/betting/oddsDataCollector.ts`)

Collects and aggregates team statistics from historical match data:

**Functions:**
- `getTeamStats(teamId, matchLimit)` - Get comprehensive team statistics
- `getExpectedGoals(stats, isHome)` - Calculate expected goals
- `calculateTeamStrength(stats)` - Rate team strength (0-100)
- `getHeadToHeadStats(team1, team2)` - Get H2H statistics

**Features:**
- Analyzes last 15 matches by default (configurable)
- Separates home/away performance
- Calculates form (last 5 matches: "WWDLW")
- Computes win rates, goal averages, etc.

### 3. Odds Generator Service (`src/services/features/betting/oddsGeneratorService.ts`)

Generates betting odds using statistical and Poisson models:

**Main Function:**
```typescript
generateMatchOdds(input: OddsGenerationInput): Promise<OddsGenerationResult>
```

**Features:**
- **Statistical Model** for 1X2 odds
  - Uses team strength ratings
  - Applies home advantage (+4 points)
  - Logistic function for probability conversion
  - Configurable bookmaker margin (default: 5%)

- **Poisson Distribution** for goal-based markets
  - Over/Under 2.5 goals
  - Both Teams to Score
  - Based on expected goals calculation

- **Odds Validation**
  - Checks odds ranges (1.01 - 100.0)
  - Validates bookmaker margin (3-15%)
  - Detects arbitrage opportunities
  - Issues warnings for unusual odds

- **Manual Adjustments**
  - Apply percentage adjustments to odds
  - Useful for special circumstances (injuries, weather, etc.)

---

## How to Use

### Basic Usage

```typescript
import {generateMatchOdds} from '@/services';
import {OddsGenerationInput} from '@/types';

// Generate odds for a match
const input: OddsGenerationInput = {
  match_id: 'match-123',
  home_team_id: 'team-home',
  away_team_id: 'team-away',
  bookmaker_margin: 0.05, // 5%
};

const result = await generateMatchOdds(input);

if (result) {
  console.log('1X2 Odds:', result.odds['1X2']);
  // Output: { '1': 2.15, 'X': 3.40, '2': 3.20 }

  console.log('Both Teams Score:', result.odds.BOTH_TEAMS_SCORE);
  // Output: { YES: 1.85, NO: 1.95 }

  console.log('Over/Under 2.5:', result.odds.OVER_UNDER);
  // Output: { OVER: 1.90, UNDER: 1.90, line: 2.5 }
}
```

### Generate Odds for Upcoming Matches

```typescript
import {createClient} from '@/utils/supabase/client';
import {generateMatchOdds} from '@/services';

async function generateOddsForUpcomingMatches() {
  const supabase = createClient();

  // Get upcoming matches
  const {data: matches} = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id')
    .eq('status', 'upcoming')
    .gte('date', new Date().toISOString());

  // Generate odds for each match
  for (const match of matches || []) {
    const result = await generateMatchOdds({
      match_id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      bookmaker_margin: 0.05,
    });

    if (result) {
      // TODO: Save to betting_odds table
      console.log(`Odds generated for match ${match.id}`);
    }
  }
}
```

### Validate Odds

```typescript
import {validateOdds} from '@/services';
import {MatchOdds} from '@/types';

const odds: MatchOdds = {
  match_id: 'match-123',
  '1X2': {'1': 2.10, 'X': 3.30, '2': 3.50},
  last_updated: new Date().toISOString(),
};

const validation = validateOdds(odds);

if (!validation.isValid) {
  console.error('Invalid odds:', validation.errors);
}

if (validation.warnings) {
  console.warn('Warnings:', validation.warnings);
}

console.log('Margin:', validation.margin); // e.g., 5.2%
```

### Apply Manual Adjustments

```typescript
import {applyManualAdjustments} from '@/services';

// Increase home odds by 10%, decrease away odds by 5%
const adjustedOdds = applyManualAdjustments(originalOdds, {
  home: 10,  // +10%
  away: -5,  // -5%
});
```

---

## Understanding the Calculations

### 1. Team Strength Rating

Calculated from:
- Win rate (40% weight)
- Goal difference per match (weighted)
- Recent form (30% weight)

Formula:
```
strength = 50 + (win_rate * 0.5 * 0.4) + (goal_diff * 10) + (form_score * 0.3)
```

Range: 0-100

### 2. Match Probabilities (1X2)

Uses logistic function:
```
P(home_win) = 1 / (1 + e^(-k * strength_diff))
```

Where:
- `strength_diff` = (home_strength + 4) - away_strength
- `k = 0.03` (sensitivity parameter)
- `+4` is home advantage
- Draw probability: 27% (typical in football)

### 3. Expected Goals

Based on team's historical average:
- Home team: Uses home_record goals/match
- Away team: Uses away_record goals/match
- Fallback: Overall average if insufficient data

### 4. Over/Under Odds (Poisson)

Calculates probability of all score combinations:
```
P(total > 2.5) = Σ P(home=i) * P(away=j) for all i+j > 2.5
```

Where:
```
P(X=k) = (λ^k * e^(-λ)) / k!
```
- λ = expected goals

### 5. Both Teams to Score

```
P(BTTS) = P(home ≥ 1) * P(away ≥ 1)
         = [1 - P(home=0)] * [1 - P(away=0)]
```

### 6. Bookmaker Margin

Applied to convert probabilities to odds:
```
odds = (1 / probability) * (1 + margin)
```

Example with 5% margin:
- P(home) = 40% → odds = (1/0.40) * 1.05 = 2.625

---

## Data Requirements

### Minimum Requirements

For odds generation to work, you need:
- At least 5 completed matches per team (recommended: 15+)
- Match results with scores (home_score, away_score)
- Matches marked as 'completed' status

### Database Tables Used

**Reads from:**
- `matches` table (historical results)

**Will write to (Phase 3):**
- `betting_odds` table
- `betting_odds_history` table

---

## Configuration

### Adjustable Parameters

```typescript
// In oddsGeneratorService.ts
const DEFAULT_MARGIN = 0.05;          // 5% bookmaker margin
const MIN_ODDS = 1.01;                // Minimum odds
const MAX_ODDS = 100.0;               // Maximum odds
const DEFAULT_DRAW_PROBABILITY = 0.27; // 27% draw rate

// In oddsDataCollector.ts
const DEFAULT_MATCH_LIMIT = 15;       // Matches to analyze
const HOME_ADVANTAGE = 4;             // Home advantage points
const SENSITIVITY = 0.03;             // Logistic function k value
```

### Customizing Bookmaker Margin

```typescript
// Lower margin = better odds for users
const result = await generateMatchOdds({
  match_id: 'match-123',
  home_team_id: 'team-1',
  away_team_id: 'team-2',
  bookmaker_margin: 0.03, // 3% margin (very competitive)
});

// Higher margin = more profit/safety
const result = await generateMatchOdds({
  match_id: 'match-123',
  home_team_id: 'team-1',
  away_team_id: 'team-2',
  bookmaker_margin: 0.10, // 10% margin (conservative)
});
```

---

## Validation & Quality Checks

The system automatically validates:

✅ **Odds Range**: All odds between 1.01 and 100.0
✅ **No NaN Values**: All odds are valid numbers
✅ **Positive Margin**: Ensures no arbitrage
✅ **Reasonable Margin**: Warns if > 15%
✅ **No Arbitrage**: Checks 1X2 market integrity

Example validation output:
```typescript
{
  isValid: true,
  errors: [],
  warnings: ["High margin detected: 8.5% - odds may not be competitive"],
  margin: 8.5,
  hasArbitrage: false
}
```

---

## Example Output

```typescript
{
  match_id: "match-123",
  odds: {
    match_id: "match-123",
    "1X2": {
      "1": 2.15,  // Home win
      "X": 3.40,  // Draw
      "2": 3.20   // Away win
    },
    "BOTH_TEAMS_SCORE": {
      "YES": 1.85,
      "NO": 1.95
    },
    "OVER_UNDER": {
      "OVER": 1.90,
      "UNDER": 1.90,
      "line": 2.5
    },
    last_updated: "2025-10-13T20:00:00Z"
  },
  probabilities: {
    home_win: 0.4420,
    draw: 0.2700,
    away_win: 0.2880,
    over_2_5: 0.5263,
    under_2_5: 0.4737,
    both_teams_score: 0.5405,
    home_expected_goals: 1.75,
    away_expected_goals: 1.35
  },
  stats: {
    home_team: {
      team_id: "team-home",
      matches_played: 15,
      wins: 9,
      draws: 3,
      losses: 3,
      win_rate: 60.00,
      avg_goals_scored: 1.87,
      form: "WWDWL"
    },
    away_team: {
      team_id: "team-away",
      matches_played: 15,
      wins: 6,
      draws: 5,
      losses: 4,
      win_rate: 40.00,
      avg_goals_scored: 1.47,
      form: "DLWDW"
    }
  },
  margin: 0.05,
  generated_at: "2025-10-13T20:00:00Z"
}
```

---

## Next Steps (Phase 3)

To complete the odds management system:

1. **Create oddsService.ts**
   - Save generated odds to `betting_odds` table
   - Retrieve odds for display
   - Track odds history
   - Lock odds when match starts

2. **Update MatchBettingCard.tsx**
   - Replace `getMockOdds()` with database query
   - Show odds loading state
   - Display odds movements

3. **Create Admin Panel**
   - Generate odds for all upcoming matches
   - Manual odds adjustment UI
   - View odds history
   - Set global margin

4. **Add Cron Job**
   - Regenerate odds daily for upcoming matches
   - Update odds based on betting volume (advanced)

---

## Testing

```typescript
// Test with real match data
import {generateMatchOdds} from '@/services';

const testOddsGeneration = async () => {
  const result = await generateMatchOdds({
    match_id: 'test-match',
    home_team_id: 'your-team-1',
    away_team_id: 'your-team-2',
    bookmaker_margin: 0.05,
  });

  console.log('Generated odds:', result?.odds);
  console.log('Team stats:', result?.stats);
  console.log('Validation:', validateOdds(result!.odds));
};
```

---

## Troubleshooting

### Issue: Odds are too extreme (very high or very low)

**Cause**: Insufficient historical data or mismatched teams
**Solution**:
- Ensure at least 10 matches per team
- Check data quality (correct scores)
- Adjust margin if needed

### Issue: All odds are similar

**Cause**: Teams have similar statistics
**Solution**:
- This is expected for evenly-matched teams
- Consider using H2H data (future enhancement)
- Add manual adjustments if needed

### Issue: Validation errors

**Cause**: Invalid calculations or data
**Solution**:
- Check console logs for specific errors
- Verify team IDs are correct
- Ensure match data exists in database

---

## References

- **Poisson Distribution**: [Wikipedia](https://en.wikipedia.org/wiki/Poisson_distribution)
- **Implied Probability**: [Odds and Probability](https://www.pinnacle.com/en/betting-articles/educational/odds-explained)
- **Bookmaker Margin**: [Understanding Overround](https://help.smarkets.com/hc/en-gb/articles/214058369-What-is-overround-)

---

*Implementation Date: 2025-10-13*
*Phase: 2 of 5 (Odds Calculation Strategies)*
*Status: Complete ✅*
