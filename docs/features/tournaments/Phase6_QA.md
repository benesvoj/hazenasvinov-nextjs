# Phase 6 — QA

> **Estimate:** 2–3 MD | **Depends on:** Phase 1–5 | **Milestone:** All tests green, ready for release
>
> Parent: [Tournaments_Analysis_Report.md](Tournaments_Analysis_Report.md)

---

## Checklist

- [ ] 6.1 Unit tests: round-robin generator
- [ ] 6.2 Unit tests: tournament standings calculator
- [ ] 6.3 Integration tests: CRUD hooks & mutations
- [ ] 6.4 E2E: admin happy path (create → publish)
- [ ] 6.5 E2E: public page rendering
- [ ] 6.6 Cross-browser / mobile testing
- [ ] 6.7 Bug fixes & polish

---

## 6.1 Unit tests: round-robin generator (0.5 MD)

**File:** `src/utils/__tests__/roundRobinGenerator.test.ts`

**Framework:** Vitest (project standard)

### Test cases

```typescript
import {describe, it, expect} from 'vitest';
import {generateRoundRobin} from '../roundRobinGenerator';

describe('generateRoundRobin', () => {
  // --- Valid inputs ---

  it('generates correct matches for 4 teams', () => {
    const result = generateRoundRobin({
      teams: [
        {team_id: 'a', seed_order: 1},
        {team_id: 'b', seed_order: 2},
        {team_id: 'c', seed_order: 3},
        {team_id: 'd', seed_order: 4},
      ],
    });

    expect(result.matches).toHaveLength(6);       // 4*3/2
    expect(result.rounds).toBe(3);                 // N-1
    expect(result.hasByes).toBe(false);
  });

  it('generates correct matches for 6 teams', () => {
    const result = generateRoundRobin({
      teams: Array.from({length: 6}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1})),
    });

    expect(result.matches).toHaveLength(15);       // 6*5/2
    expect(result.rounds).toBe(5);                 // N-1
    expect(result.hasByes).toBe(false);
  });

  it('generates correct matches for 8 teams', () => {
    const result = generateRoundRobin({
      teams: Array.from({length: 8}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1})),
    });

    expect(result.matches).toHaveLength(28);       // 8*7/2
    expect(result.rounds).toBe(7);
  });

  // --- Odd number of teams (bye handling) ---

  it('handles 3 teams with byes', () => {
    const result = generateRoundRobin({
      teams: [
        {team_id: 'a', seed_order: 1},
        {team_id: 'b', seed_order: 2},
        {team_id: 'c', seed_order: 3},
      ],
    });

    expect(result.matches).toHaveLength(3);        // 3*2/2
    expect(result.rounds).toBe(3);                 // N rounds for odd N
    expect(result.hasByes).toBe(true);
  });

  it('handles 5 teams with byes', () => {
    const result = generateRoundRobin({
      teams: Array.from({length: 5}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1})),
    });

    expect(result.matches).toHaveLength(10);       // 5*4/2
    expect(result.rounds).toBe(5);
    expect(result.hasByes).toBe(true);
  });

  // --- Invariants ---

  it('each pair plays exactly once', () => {
    const teams = Array.from({length: 6}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1}));
    const result = generateRoundRobin({teams});

    const pairSet = new Set<string>();
    result.matches.forEach((m) => {
      const pair = [m.home_team_id, m.away_team_id].sort().join('-');
      expect(pairSet.has(pair)).toBe(false);       // No duplicate pair
      pairSet.add(pair);
    });

    // All pairs present
    expect(pairSet.size).toBe(15);                 // 6*5/2
  });

  it('no self-matches', () => {
    const teams = Array.from({length: 6}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1}));
    const result = generateRoundRobin({teams});

    result.matches.forEach((m) => {
      expect(m.home_team_id).not.toBe(m.away_team_id);
    });
  });

  it('all matches have a valid round number', () => {
    const teams = Array.from({length: 6}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1}));
    const result = generateRoundRobin({teams});

    result.matches.forEach((m) => {
      expect(m.round).toBeGreaterThanOrEqual(1);
      expect(m.round).toBeLessThanOrEqual(result.rounds);
    });
  });

  it('each team plays at most once per round', () => {
    const teams = Array.from({length: 6}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1}));
    const result = generateRoundRobin({teams});

    for (let round = 1; round <= result.rounds; round++) {
      const roundMatches = result.matches.filter((m) => m.round === round);
      const teamsInRound = new Set<string>();

      roundMatches.forEach((m) => {
        expect(teamsInRound.has(m.home_team_id)).toBe(false);
        expect(teamsInRound.has(m.away_team_id)).toBe(false);
        teamsInRound.add(m.home_team_id);
        teamsInRound.add(m.away_team_id);
      });
    }
  });

  it('higher seed is home in first meeting', () => {
    const teams = [
      {team_id: 'seed1', seed_order: 1},
      {team_id: 'seed2', seed_order: 2},
      {team_id: 'seed3', seed_order: 3},
      {team_id: 'seed4', seed_order: 4},
    ];
    const result = generateRoundRobin({teams});

    // Find match between seed1 and seed2
    const match = result.matches.find(
      (m) =>
        (m.home_team_id === 'seed1' && m.away_team_id === 'seed2') ||
        (m.home_team_id === 'seed2' && m.away_team_id === 'seed1')
    );
    expect(match).toBeDefined();
    expect(match!.home_team_id).toBe('seed1');     // Higher seed = home
  });

  // --- Edge cases ---

  it('throws error for fewer than 3 teams', () => {
    expect(() =>
      generateRoundRobin({
        teams: [{team_id: 'a', seed_order: 1}, {team_id: 'b', seed_order: 2}],
      })
    ).toThrow();
  });

  it('handles 12 teams correctly', () => {
    const teams = Array.from({length: 12}, (_, i) => ({team_id: `t${i}`, seed_order: i + 1}));
    const result = generateRoundRobin({teams});

    expect(result.matches).toHaveLength(66);       // 12*11/2
    expect(result.rounds).toBe(11);
  });
});
```

---

## 6.2 Unit tests: tournament standings calculator (0.3 MD)

**File:** `src/utils/__tests__/tournamentStandingsCalculator.test.ts`

### Test cases

```typescript
describe('calculateTournamentStandings', () => {
  it('calculates correct points for W/D/L', () => {
    // 2 points for win, 1 for draw, 0 for loss
  });

  it('sorts by points descending', () => {
    // Team with more points ranks higher
  });

  it('breaks ties by goal difference', () => {
    // Equal points → higher goal difference ranks higher
  });

  it('breaks goal difference ties by goals scored', () => {
    // Equal points + GD → more goals scored ranks higher
  });

  it('skips matches without results', () => {
    // Upcoming matches should not affect standings
  });

  it('handles all draws correctly', () => {
    // Every match is a draw → all teams equal points
  });

  it('handles zero completed matches', () => {
    // All standings should be zero
  });

  it('assigns correct positions', () => {
    // Positions 1, 2, 3, ... based on sorted order
  });
});
```

---

## 6.3 Integration tests: CRUD hooks & mutations (0.5 MD)

**File:** `src/hooks/entities/tournament/__tests__/useTournaments.test.ts`

### Test scope

| Test | What it verifies |
|---|---|
| Create tournament | Mutation calls API, returns created entity |
| Update tournament | Partial update works, `updated_at` changes |
| Delete tournament | Removes entity, cascade deletes teams/standings |
| Fetch tournaments | Returns list with correct shape |
| Fetch by slug | Returns single tournament or throws |
| Query invalidation | Cache invalidated after mutation |
| Add team to tournament | `tournament_teams` insert works |
| Remove team | Delete with tournament + team compound key |
| Update seed orders | Bulk seed order update |
| Generate schedule | Creates correct number of matches |
| Wipe & regenerate | Deletes old matches, creates new ones |

---

## 6.4 E2E: admin happy path (0.5 MD)

### Test script

```
1. Navigate to /admin/tournaments
2. Click "Nový turnaj"
3. Fill form: name, category, season, start_date, venue
4. Submit → tournament appears in list
5. Click tournament → detail page loads with 5 tabs

6. Tab "Týmy":
   - Add 4 teams from picker
   - Verify seed order 1-4
   - Reorder seeds

7. Tab "Rozpis zápasů":
   - Click "Generovat rozpis"
   - Verify 6 matches in 3 rounds
   - Click match → edit result (e.g., 3:1)
   - Save → toast confirms standings update

8. Tab "Tabulka":
   - Verify standings updated with match result
   - Enter remaining 5 results
   - Click "Přepočítat" → standings reflect all results
   - Verify correct positions and point totals

9. Tab "Publikace":
   - Click "Publikovat"
   - Verify status changes to "Publikováno"
   - Copy public link

10. Visit public link → tournament page renders:
    - Header with name, date, venue
    - Schedule with all results
    - Standings table
```

---

## 6.5 E2E: public page rendering (0.3 MD)

### Test cases

| Test | Expected |
|---|---|
| Valid slug, published tournament | Page renders with header, schedule, standings |
| Valid slug, draft tournament | 404 page |
| Non-existent slug | 404 page |
| Tournament with no matches | Header + empty schedule message |
| Tournament with no standings | Header + schedule + empty standings message |
| Mobile viewport (375px) | Responsive layout, collapsed table columns |
| Tablet viewport (768px) | Medium layout |
| Desktop viewport (1280px) | Full layout with all columns |

### SEO verification

| Check | Expected |
|---|---|
| `<title>` | Contains tournament name |
| `<meta name="description">` | Contains tournament description or summary |
| `og:title` | Tournament name |
| `og:type` | `website` |
| Canonical URL | `/tournaments/{slug}` |

---

## 6.6 Cross-browser / mobile testing (0.3 MD)

### Browser matrix

| Browser | Version | Priority |
|---|---|---|
| Chrome | Latest | High |
| Firefox | Latest | High |
| Safari | Latest | High |
| Edge | Latest | Medium |
| Safari iOS | Latest | High |
| Chrome Android | Latest | High |

### Mobile-specific checks

- [ ] Standings table: position, team, score, points visible (W/D/L hidden)
- [ ] Schedule: match rows stack vertically
- [ ] Team logos: hidden on mobile, visible on desktop
- [ ] Touch targets: buttons/links have adequate size (44x44px minimum)
- [ ] Horizontal scroll: no unintended overflow
- [ ] Homepage teaser: cards stack vertically

---

## 6.7 Bug fixes & polish (0.5 MD)

Buffer for issues discovered during testing. Common areas:

- [ ] Loading states: spinners show during data fetch
- [ ] Error states: meaningful Czech messages on API errors
- [ ] Empty states: `EmptyState` components with appropriate type/icon
- [ ] Toast messages: correct Czech text for success/error
- [ ] Form validation: required fields enforced, slug uniqueness check
- [ ] Navigation: back button works correctly from detail page
- [ ] Cache: query invalidation after all mutations
- [ ] Accessibility: ARIA labels on tables and interactive elements

---

## Exit criteria

Before marking Phase 6 complete:

- [ ] All unit tests pass: `npm run test:run`
- [ ] TypeScript compiles: `npm run tsc`
- [ ] Lint passes: `npm run lint`
- [ ] Admin happy path works end-to-end
- [ ] Public page renders correctly for published tournament
- [ ] Draft tournaments return 404 on public page
- [ ] Mobile responsive on all public pages
- [ ] No console errors in browser dev tools
- [ ] All Czech strings used (no hardcoded English)
