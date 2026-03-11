# Phase 4 — Standings / Live

> **Estimate:** 1–1.5 MD | **Depends on:** Phase 2–3 | **Milestone:** Standings auto-update on result entry
>
> Parent: [Tournaments_Analysis_Report.md](Tournaments_Analysis_Report.md)

---

## Checklist

- [ ] 4.1 Extend `autoRecalculateStandings` for tournament context
- [ ] 4.2 Generate initial tournament standings utility
- [ ] 4.3 Wire recalculate button in admin standings tab
- [ ] 4.4 Tournament standings hook
- [ ] 4.5 Verify end-to-end: result → standings update

---

## 4.1 Extend `autoRecalculateStandings` for tournaments (0.4 MD)

**File:** `src/utils/autoStandingsRecalculation.ts`

**Reference:** Current implementation handles league standings by looking up `category_id` + `season_id` from a match and recalculating the `standings` table.

### Changes needed

After existing league recalculation logic, add tournament detection:

```typescript
export async function autoRecalculateStandings(
  matchId: string,
  categoryId?: string,
  seasonId?: string
): Promise<{success: boolean; error?: string; recalculated?: boolean}> {
  const supabase = supabaseBrowserClient();

  try {
    // 1. Fetch match to get context
    const {data: match, error: matchError} = await supabase
      .from('matches')
      .select('category_id, season_id, tournament_id')   // ← ADD tournament_id
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return {success: false, error: 'Zápas nenalezen'};
    }

    // 2. If tournament match → recalculate tournament standings
    if (match.tournament_id) {
      return await recalculateTournamentStandings(match.tournament_id);
    }

    // 3. Otherwise → existing league standings logic (unchanged)
    // ... existing code ...
  } catch (error) {
    return {success: false, error: 'Neočekávaná chyba'};
  }
}

async function recalculateTournamentStandings(
  tournamentId: string
): Promise<{success: boolean; error?: string; recalculated?: boolean}> {
  try {
    const result = await calculateTournamentStandings(tournamentId);
    return {
      success: result.success,
      recalculated: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chyba při přepočtu tabulky turnaje',
    };
  }
}
```

### Key point

The existing `useMatchMutations` hook already calls `autoRecalculateStandings(matchId)` after score updates. By adding tournament detection to that function, tournament standings will auto-update without any changes to the hook itself.

---

## 4.2 Generate initial tournament standings (0.2 MD)

**File:** `src/utils/tournamentStandingsCalculator.ts` (add to existing from Phase 2)

**Reference:** `src/utils/standingsGenerator.ts`

```typescript
export async function generateInitialTournamentStandings(
  tournamentId: string
): Promise<{success: boolean; error?: string}> {
  const supabase = supabaseBrowserClient();

  try {
    // 1. Check if standings already exist
    const {data: existing} = await supabase
      .from('tournament_standings')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1);

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: 'Tabulka již existuje. Použijte "Přepočítat tabulku" pro aktualizaci.',
      };
    }

    // 2. Fetch tournament teams
    const {data: teams, error: teamsError} = await supabase
      .from('tournament_teams')
      .select('team_id')
      .eq('tournament_id', tournamentId)
      .order('seed_order', {ascending: true});

    if (teamsError) throw teamsError;
    if (!teams || teams.length === 0) {
      return {success: false, error: 'Žádné týmy v turnaji'};
    }

    // 3. Create initial standings (all zeroes)
    const initialStandings = teams.map((t, index) => ({
      tournament_id: tournamentId,
      team_id: t.team_id,
      position: index + 1,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      points: 0,
    }));

    // 4. Insert
    const {error: insertError} = await supabase
      .from('tournament_standings')
      .insert(initialStandings);

    if (insertError) throw insertError;

    return {success: true};
  } catch (error) {
    console.error('Error generating tournament standings:', error);
    return {
      success: false,
      error: `Chyba při generování tabulky: ${error instanceof Error ? error.message : 'Neznámá chyba'}`,
    };
  }
}
```

---

## 4.3 Wire recalculate button in admin (0.2 MD)

Already defined in Phase 3 (`StandingsTab.tsx`). This task connects the UI buttons to the utilities:

### Generate button

Calls `generateInitialTournamentStandings(tournamentId)`. Only shown when no standings exist.

### Recalculate button

Calls `calculateTournamentStandings(tournamentId)`. Always available when standings exist.

### Auto-recalculation flow

```
User enters match result
  → useMatchMutations.updateMatchResult(matchId, scores)
    → autoRecalculateStandings(matchId)
      → detects match.tournament_id
        → calculateTournamentStandings(tournamentId)
          → upserts tournament_standings
    → invalidates ['tournament-standings', tournamentId]
  → StandingsTab re-renders with updated data
```

---

## 4.4 Tournament standings hook (0.2 MD)

**File:** `src/hooks/entities/tournament/state/useTournamentStandings.ts`

**Reference:** `src/hooks/entities/standings/useStandings.ts`

```typescript
'use client';

import {useCallback, useState} from 'react';
import {supabaseBrowserClient} from '@/utils/supabase/client';
import {EnhancedStanding} from '@/types';

export function useTournamentStandings(tournamentId: string) {
  const [standings, setStandings] = useState<EnhancedStanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStandings = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = supabaseBrowserClient();

      const {data, error: fetchError} = await supabase
        .from('tournament_standings')
        .select(`
          *,
          team:club_category_teams(
            id,
            team_suffix,
            club_category:club_categories(
              club:clubs(id, name, short_name, logo_url)
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('position', {ascending: true});

      if (fetchError) throw fetchError;

      // Transform to EnhancedStanding format
      const enhanced: EnhancedStanding[] = (data || []).map((row: any) => ({
        ...row,
        team: row.team
          ? {
              id: row.team.id,
              team_suffix: row.team.team_suffix,
              club_name: row.team.club_category?.club?.name || '',
              club_id: row.team.club_category?.club?.id || null,
            }
          : null,
        club: row.team?.club_category?.club
          ? {
              id: row.team.club_category.club.id,
              name: row.team.club_category.club.name,
              short_name: row.team.club_category.club.short_name,
              logo_url: row.team.club_category.club.logo_url,
            }
          : null,
      }));

      setStandings(enhanced);
    } catch (err: any) {
      console.error('Error fetching tournament standings:', err);
      setError(err.message || 'Chyba při načítání tabulky');
      setStandings([]);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  const clearStandings = useCallback(() => {
    setStandings([]);
    setError(null);
  }, []);

  return {standings, loading, error, fetchStandings, clearStandings};
}
```

---

## 4.5 End-to-end verification (0.2 MD)

### Manual test script

1. Create tournament with 4 teams (Phase 3).
2. Generate round-robin schedule (6 matches).
3. Go to Standings tab → click "Generate standings" → 4 teams with zero stats appear.
4. Go to Schedule tab → enter result for match 1 (e.g., 3:1).
5. Verify standings auto-updated:
   - Winner: 1 match, 1 win, 2 points, 3:1 goals
   - Loser: 1 match, 1 loss, 0 points, 1:3 goals
   - Other 2 teams: 0 matches, 0 points
6. Enter results for all 6 matches.
7. Verify final standings:
   - Positions assigned correctly (sorted by points → GD → GF)
   - All teams show 3 matches
   - Total goals consistent across all rows

### Automated test

Add integration test that:
1. Mocks Supabase client
2. Creates 4 tournament teams
3. Simulates 6 match results
4. Calls `calculateTournamentStandings`
5. Asserts correct positions, points, and goal stats

---

## Expected file changes after Phase 4

```
src/utils/autoStandingsRecalculation.ts        ← modified (add tournament detection)
src/utils/tournamentStandingsCalculator.ts      ← modified (add generateInitial)
src/hooks/entities/tournament/state/
  useTournamentStandings.ts                     ← new
```
