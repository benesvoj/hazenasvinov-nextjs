# Betting Odds Tuning Guide

## Current Issue: Odds Too Extreme

If your odds show very low values (like 1.01) or very high values (like 100), this means the probabilities are too extreme (99% or 1%).

### Why This Happens

Your league might be:
- **High-scoring** (youth football, futsal, handball) - lots of goals
- **Low-scoring** (defensive amateur leagues) - few goals
- **Unbalanced teams** - big skill differences

###Solution: Adjust Expected Goals Bounds

Edit `src/services/features/betting/oddsDataCollector.ts`, line 176:

```typescript
// Current (for typical football):
return Number(Math.max(0.8, Math.min(4.0, avgGoals)).toFixed(2));

// For HIGH-SCORING leagues (futsal, youth with 5+ goals/match):
return Number(Math.max(1.5, Math.min(5.0, avgGoals)).toFixed(2));

// For LOW-SCORING leagues (defensive, amateur with <2 goals/match):
return Number(Math.max(0.5, Math.min(2.5, avgGoals)).toFixed(2));

// For VERY UNBALANCED leagues (one team always wins big):
return Number(Math.max(0.3, Math.min(6.0, avgGoals)).toFixed(2));
```

### Quick Fix

If you want more balanced odds right now, you can increase the bookmaker margin:

```bash
# Edit scripts/generate-odds.ts, line in generateOddsForUpcomingMatches call
bookmaker_margin: 0.10  // 10% instead of 5%
```

Higher margin = more conservative odds = less extreme values.

### Understanding Your League

Run this to see average goals in your matches:

```sql
SELECT
  AVG(home_score + away_score) as avg_total_goals,
  AVG(home_score) as avg_home_goals,
  AVG(away_score) as avg_away_goals
FROM matches
WHERE status = 'completed'
  AND home_score IS NOT NULL
  AND away_score IS NOT NULL;
```

**Typical ranges:**
- Professional football: 2.5-3.0 total goals
- Amateur football: 2.0-4.0 total goals
- Youth football: 4.0-8.0 total goals
- Futsal: 6.0-10.0 total goals

### After Adjusting

1. Make your changes
2. Regenerate odds: `npm run betting:generate-odds`
3. Check results: `npx tsx scripts/show-all-odds.ts`

The odds should now look more reasonable!
