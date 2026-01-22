# Odds Management System - Comprehensive Plan

## Overview
This document outlines the strategy for implementing a proper odds management system for the betting platform, replacing the current mock odds implementation with a robust, data-driven approach.

---

## Current State

- Mock odds hardcoded in `MatchBettingCard.tsx:25-39`
- Only three bet types: 1X2, BOTH_TEAMS_SCORE, OVER_UNDER
- Fixed odds values (e.g., 1X2: 2.1, 3.2, 3.8)
- No database storage for odds
- Good foundation: `oddsCalculator.ts` with utility functions

---

## Phase 1: Database Schema for Odds Storage

### 1.1 Create `betting_odds` table

```sql
CREATE TABLE betting_odds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id TEXT NOT NULL,
  bet_type TEXT NOT NULL, -- '1X2', 'BOTH_TEAMS_SCORE', 'OVER_UNDER', etc.
  selection TEXT NOT NULL, -- '1', 'X', '2', 'YES', 'NO', 'OVER', 'UNDER'
  odds NUMERIC(8,3) NOT NULL,
  parameter TEXT, -- e.g., '2.5' for OVER_UNDER 2.5 goals

  -- Metadata
  source TEXT, -- 'MANUAL', 'CALCULATED', 'EXTERNAL_API'
  bookmaker_margin NUMERIC(5,2), -- Track the built-in margin
  implied_probability NUMERIC(5,2), -- Pre-calculated for performance

  -- Timestamps
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Track odds movements
  previous_odds NUMERIC(8,3),
  odds_change_percentage NUMERIC(5,2),

  CONSTRAINT unique_odds_per_match_bet_selection
    UNIQUE(match_id, bet_type, selection, parameter, effective_from)
);

CREATE INDEX idx_betting_odds_match ON betting_odds(match_id);
CREATE INDEX idx_betting_odds_effective ON betting_odds(effective_from, effective_until);
CREATE INDEX idx_betting_odds_bet_type ON betting_odds(bet_type);
```

### 1.2 Create `betting_odds_history` table

For tracking odds movements over time:

```sql
CREATE TABLE betting_odds_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  odds_id UUID REFERENCES betting_odds(id),
  match_id TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  selection TEXT NOT NULL,
  old_odds NUMERIC(8,3),
  new_odds NUMERIC(8,3),
  change_percentage NUMERIC(5,2),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT -- 'MARKET_MOVEMENT', 'TEAM_NEWS', 'MANUAL_ADJUSTMENT'
);

CREATE INDEX idx_odds_history_match ON betting_odds_history(match_id);
CREATE INDEX idx_odds_history_changed_at ON betting_odds_history(changed_at DESC);
```

---

## Phase 2: Odds Calculation Strategies

### 2.1 Statistical Model (Recommended for Start)

Create `oddsGenerator.ts` service:

```typescript
// Strategy: Use historical team performance
interface TeamStats {
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  home_record: {wins: number; draws: number; losses: number};
  away_record: {wins: number; draws: number; losses: number};
}

function calculateOddsFromStats(
  homeTeam: TeamStats,
  awayTeam: TeamStats,
  margin: number = 0.05 // 5% bookmaker margin
) {
  // 1. Calculate win probabilities
  const homeWinProb = calculateWinProbability(homeTeam, awayTeam, true);
  const awayWinProb = calculateWinProbability(awayTeam, homeTeam, false);
  const drawProb = 1 - homeWinProb - awayWinProb;

  // 2. Add bookmaker margin
  const totalProb = homeWinProb + drawProb + awayWinProb;
  const marginMultiplier = 1 + margin;

  // 3. Convert to odds
  const odds1X2 = {
    '1': (totalProb / homeWinProb) * marginMultiplier,
    'X': (totalProb / drawProb) * marginMultiplier,
    '2': (totalProb / awayWinProb) * marginMultiplier
  };

  return odds1X2;
}
```

**Data Sources for Stats:**
- Existing `matches` table (historical results)
- Calculate from: `home_score`, `away_score`, `status: 'completed'`
- Rolling window: Last 10-15 matches per team

### 2.2 Poisson Distribution Model (Advanced)

For goal-based markets (OVER/UNDER, BOTH_TEAMS_SCORE):

```typescript
function poissonProbability(lambda: number, k: number) {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function calculateOverUnderOdds(
  homeExpectedGoals: number,
  awayExpectedGoals: number,
  line: number = 2.5
) {
  // Calculate probability of total goals > line
  let overProb = 0;
  for (let homeGoals = 0; homeGoals <= 10; homeGoals++) {
    for (let awayGoals = 0; awayGoals <= 10; awayGoals++) {
      if (homeGoals + awayGoals > line) {
        overProb +=
          poissonProbability(homeExpectedGoals, homeGoals) *
          poissonProbability(awayExpectedGoals, awayGoals);
      }
    }
  }

  return {
    OVER: (1 / overProb) * 1.05, // 5% margin
    UNDER: (1 / (1 - overProb)) * 1.05
  };
}
```

### 2.3 Elo Rating System

Implement team strength ratings:

```typescript
// Add to database
CREATE TABLE betting_team_elo_ratings (
  team_id TEXT PRIMARY KEY,
  elo_rating INTEGER DEFAULT 1500,
  home_advantage INTEGER DEFAULT 100,
  updated_at TIMESTAMPTZ
);

// Calculate odds from Elo difference
function oddsFromElo(homeElo: number, awayElo: number) {
  const eloDiff = homeElo - awayElo;
  const homeWinProb = 1 / (1 + Math.pow(10, -eloDiff / 400));

  // Estimate draw probability (usually 25-30% in football)
  const drawProb = 0.27;
  const awayWinProb = 1 - homeWinProb - drawProb;

  return {
    '1': 1 / homeWinProb,
    'X': 1 / drawProb,
    '2': 1 / awayWinProb
  };
}
```

---

## Phase 3: Implementation Roadmap

### Step 1: Database Setup (Week 1)
- [ ] Create `betting_odds` table
- [ ] Create `betting_odds_history` table
- [ ] Create `betting_team_elo_ratings` table (optional)
- [ ] Set up RLS policies
- [ ] Create functions for odds updates

### Step 2: Data Collection Service (Week 1-2)
Create `src/services/features/betting/oddsDataCollector.ts`:
- [ ] Function to aggregate team statistics from matches table
- [ ] Calculate team stats (W/D/L, goals, home/away records)
- [ ] Store in cache/database for performance

### Step 3: Odds Generation Service (Week 2-3)
Create `src/services/features/betting/oddsGenerator.ts`:
- [ ] Implement basic statistical model
- [ ] Implement Poisson model for goals
- [ ] Add configurable bookmaker margin (5-10%)
- [ ] Generate all bet types: 1X2, BTTS, O/U
- [ ] Include odds validation (1.01 - 100.0 range)

### Step 4: Odds Management Service (Week 3)
Create `src/services/features/betting/oddsService.ts`:

```typescript
// Core functions:
- generateOddsForMatch(matchId: string): Promise<OddsSet>
- getOddsForMatch(matchId: string): Promise<OddsSet | null>
- updateOddsForMatch(matchId: string, odds: OddsSet): Promise<boolean>
- getOddsHistory(matchId: string): Promise<OddsHistory[]>
- lockOdds(matchId: string): Promise<void> // Lock when match starts
```

### Step 5: UI Integration (Week 4)
- [ ] Replace `getMockOdds()` with `useMatchOdds(matchId)` hook
- [ ] Show odds loading states
- [ ] Display odds movements (↑↓ indicators)
- [ ] Add "Last updated" timestamp
- [ ] Show implied probability (optional)

### Step 6: Admin Panel (Week 4-5)
Create admin interface for:
- [ ] Manual odds adjustment
- [ ] Bulk odds generation for multiple matches
- [ ] Set bookmaker margin globally/per match
- [ ] View odds history and movements
- [ ] Lock/unlock betting markets

---

## Phase 4: Advanced Features (Future)

### 4.1 External Odds API Integration
- [ ] Research APIs: Odds API, The Odds API, API-Football
- [ ] Create adapter pattern for multiple providers
- [ ] Implement fallback to calculated odds
- [ ] Cost management and rate limiting

### 4.2 Dynamic Odds (Real-time)
- [ ] Adjust odds based on betting volume
- [ ] Liability management (prevent huge losses)
- [ ] Auto-suspend markets when needed
- [ ] Real-time updates via Supabase subscriptions

### 4.3 Machine Learning Model
- [ ] Collect historical match outcomes
- [ ] Train prediction model (Python/TensorFlow)
- [ ] Feature engineering (team form, H2H, injuries)
- [ ] Deploy as API endpoint
- [ ] A/B test against statistical model

---

## Phase 5: Odds Quality Assurance

### 5.1 Validation Rules

```typescript
interface OddsValidation {
  // Ensure market integrity
  checkMarginRange: (odds: number[]) => boolean; // 3-15%
  checkArbitrage: (odds: number[]) => boolean;    // No guaranteed profit
  checkReasonableRange: (odds: number) => boolean; // 1.01 - 100.00
  checkSuspiciousMovement: (change: number) => boolean; // >30% = alert
}
```

### 5.2 Testing Strategy
- [ ] Unit tests for all calculation functions
- [ ] Integration tests with real match data
- [ ] Backtesting: Compare predictions vs actual results
- [ ] Monitor accuracy metrics (Brier score, log loss)

---

## Recommended Starting Point

### Quick Win (1-2 weeks):

1. Create `betting_odds` table
2. Implement basic statistical model using existing matches data
3. Create seeding script to generate odds for upcoming matches
4. Replace mock odds with database queries
5. Add admin page to regenerate odds

### Example Implementation Priority:

```typescript
// src/services/features/betting/oddsGenerator.ts
export async function generateMatchOdds(matchId: string): Promise<OddsSet> {
  // Step 1: Get team statistics
  const homeTeamStats = await getTeamStats(match.home_team_id);
  const awayTeamStats = await getTeamStats(match.away_team_id);

  // Step 2: Calculate probabilities
  const probabilities = calculateMatchProbabilities(homeTeamStats, awayTeamStats);

  // Step 3: Apply margin and convert to odds
  const odds1X2 = applyMarginAndConvert(probabilities, 0.05);

  // Step 4: Generate additional markets
  const oddsOU = generateOverUnderOdds(homeTeamStats, awayTeamStats);
  const oddsBTTS = generateBothTeamsScoreOdds(homeTeamStats, awayTeamStats);

  // Step 5: Save to database
  await saveOdds(matchId, {odds1X2, oddsOU, oddsBTTS});

  return {odds1X2, oddsOU, oddsBTTS};
}
```

---

## Key Considerations

1. **Margin Management**: Start with 5-8% margin (lower = more attractive to users)
2. **Update Frequency**:
   - Initial: Once when match is created
   - Advanced: Daily updates until match starts
   - Real-time: Continuous updates based on bets placed
3. **Liability**: Set max bet limits to control risk exposure
4. **Fairness**: Ensure odds are competitive and fair for community betting
5. **Transparency**: Show users implied probabilities and margin

---

## References

- Current implementation: `src/components/features/betting/MatchBettingCard.tsx:25-39`
- Odds utilities: `src/services/features/betting/oddsCalculator.ts`
- Database schema: `docs/BETTING_DATABASE_SCHEMA.md`
- Match types: `src/types/entities/match/data/matches.ts`

---

## Next Steps

To begin implementation:
1. Review and approve this plan
2. Start with Phase 1: Database Schema
3. Implement Phase 2.1: Basic Statistical Model
4. Create migration script for database changes
5. Build admin tools for odds management

---

*Last Updated: 2025-10-13*