# Tournaments Feature — Analysis Report

## 1. Summary

### Goals
- Introduce a **Tournaments** entity for day/two-day round-robin tournaments ("každý s každým") with final standings.
- Admin portal: full lifecycle — metadata, teams, schedule generation, match result editing, live standings, publication, blog attachment, public link.
- Public site: tournament detail page (slug), homepage teaser, blog embed (schedule + standings).

### Non-goals
- Coach portal (future phase).
- Knockout/bracket tournaments.
- Rewriting existing match or standings logic — extend compatibly.

### Assumptions
- A tournament is scoped to a single **category** and **season** (same as matches).
- Teams in a tournament come from existing `club_category_teams` (same pool as league matches).
- Scoring rules: 2 pts for win, 1 pt for draw, 0 for loss (matching existing `standingsCalculator`).
- One slug per tournament, globally unique.
- A tournament can be linked to one blog post (like matches via `post_id`).

### Open Questions
1. Should tournaments support **multiple days/rounds** with distinct dates, or is a simple start_date + end_date sufficient?
2. Should tournament standings be persisted (like league standings) or computed on-the-fly? (See recommendation in §3.)
3. Can a team appear in multiple tournaments within the same season?
4. Should the public tournament page be indexable by search engines (SSR/SSG)?

---

## 2. Domain Model

### New table: `tournaments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Default `gen_random_uuid()` |
| `name` | text NOT NULL | Tournament name (e.g. "Velikonoční turnaj 2026") |
| `slug` | text UNIQUE NOT NULL | URL-safe identifier, auto-generated from name |
| `description` | text | Optional rich-text description |
| `category_id` | uuid FK → categories | Which age group / category |
| `season_id` | uuid FK → seasons | Which season |
| `start_date` | date NOT NULL | First day of tournament |
| `end_date` | date | Second day (nullable for single-day) |
| `venue` | text | Location |
| `status` | text NOT NULL DEFAULT 'draft' | `draft` / `published` / `archived` |
| `post_id` | uuid FK → blog_posts | Optional linked blog post |
| `image_url` | text | Optional cover image |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Default `now()` |

### New table: `tournament_teams`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tournament_id` | uuid FK → tournaments | |
| `team_id` | uuid FK → club_category_teams | Reuse existing teams |
| `seed_order` | int | Ordering for schedule generation |
| `created_at` | timestamptz | |

**Unique constraint:** `(tournament_id, team_id)` — a team can only appear once per tournament.

### Extending `matches` table

**Recommendation: Reuse `matches` with a nullable `tournament_id` column.**

Rationale:
- Matches already have all needed fields: `home_team_id`, `away_team_id`, scores, `status`, `date`, `time`, `venue`, `category_id`, `season_id`.
- Existing mutation helpers (`createMutationHelpers`), hooks (`useMatchMutations`), and components (match modals, `MatchSchedule`) can be reused with minimal changes.
- Tournament matches are distinguished by `WHERE tournament_id IS NOT NULL`.
- The `competition` field already has `CompetitionTypes.TOURNAMENT` enum value.

New column on `matches`:
| Column | Type | Notes |
|---|---|---|
| `tournament_id` | uuid FK → tournaments, nullable | NULL for league matches |
| `round` | int, nullable | Round number within tournament |

### Tournament standings: **Persisted** (recommended)

Reuse the existing `standings` table pattern but scoped to tournament:

### New table: `tournament_standings`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `tournament_id` | uuid FK → tournaments | |
| `team_id` | uuid FK → club_category_teams | |
| `position` | int | |
| `matches` | int DEFAULT 0 | |
| `wins` | int DEFAULT 0 | |
| `draws` | int DEFAULT 0 | |
| `losses` | int DEFAULT 0 | |
| `goals_for` | int DEFAULT 0 | |
| `goals_against` | int DEFAULT 0 | |
| `points` | int DEFAULT 0 | |

**Unique constraint:** `(tournament_id, team_id)`

**Why persisted instead of on-the-fly:**
- Consistent with existing `standings` table pattern.
- Avoids recomputing on every public page load (performance for embeds/public pages).
- Auto-recalculation on match result save (reuse `autoRecalculateStandings` pattern).
- Allows manual position overrides if needed (tiebreaker decisions).

**Why separate from `standings`:**
- `standings` is keyed on `(category_id, season_id, team_id)` — a team could play in league AND tournament in the same season; mixing them would conflict.
- Tournament standings have different lifecycle (tournament-scoped, not season-long).

---

## 3. Data Access & RLS

### Access rules by role

| Entity | Admin | Coach (future) | Public (anon) |
|---|---|---|---|
| `tournaments` | Full CRUD | Read published | Read published only |
| `tournament_teams` | Full CRUD | Read (own category) | Read (published tournaments) |
| `matches` (tournament) | Full CRUD | Read + edit results (own category) | Read (published tournaments) |
| `tournament_standings` | Full CRUD + recalculate | Read (own category) | Read (published tournaments) |

### RLS policies (following existing grants/betting pattern)

```
-- tournaments: admin full, public read published
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

Policy "Admins full access": role = 'admin' in user_profiles → all operations
Policy "Public read published": status = 'published' → SELECT for anon/authenticated
```

Same pattern for `tournament_teams` and `tournament_standings` — join through `tournaments.status` for public access.

### Indexes
- `tournaments(slug)` — unique, used for public page lookup
- `tournaments(category_id, season_id)` — listing tournaments for a category
- `tournament_teams(tournament_id)` — listing teams
- `matches(tournament_id)` — fetching tournament matches
- `tournament_standings(tournament_id)` — fetching standings

### Slug strategy
- Auto-generate from `name` using `slugify()` (lowercase, diacritics removed, hyphens).
- Unique constraint at DB level.
- Admin can override/edit slug before publication.
- Pattern matches existing blog post slug approach (`blog_posts.slug`).

---

## 4. API/RPC Surface

### Tournament CRUD

Follow existing entity pattern (`createMutationHelpers` factory):

| Operation | Location | Pattern |
|---|---|---|
| `createTournament` | `src/queries/tournaments/mutations.ts` | `createMutationHelpers<Tournament, TournamentInsert>` |
| `updateTournament` | same | same factory |
| `deleteTournament` | same | same factory |
| `fetchTournaments` | `src/queries/tournaments/queries.ts` | `QueryContext` pattern |
| `fetchTournamentBySlug` | same | Public fetch, like `fetchBlogPostBySlug` |

### Team management

| Operation | Notes |
|---|---|
| `addTeamToTournament(tournamentId, teamId, seedOrder)` | Insert into `tournament_teams` |
| `removeTeamFromTournament(tournamentId, teamId)` | Delete from `tournament_teams` |
| `updateSeedOrder(tournamentId, teams[])` | Bulk update seed orders |
| `fetchTournamentTeams(tournamentId)` | With club/team join for display names |

### Round-robin schedule generation

| Operation | Notes |
|---|---|
| `generateRoundRobinSchedule(tournamentId, options)` | Creates match rows |

**Contract:**
- Input: `tournamentId`, optional `{ wipeExisting: boolean }`.
- Reads `tournament_teams` ordered by `seed_order`.
- Generates all unique pairings (N teams → N*(N-1)/2 matches).
- If `wipeExisting: true`, deletes existing tournament matches first.
- If matches already exist and `wipeExisting: false`, returns error.
- Sets `competition = 'tournament'`, `tournament_id`, `round` (computed), `status = 'upcoming'`.
- Idempotent when called with same teams and `wipeExisting: true`.

### Match editing

Reuse existing `useMatchMutations` hook — extend it to accept optional `tournament_id` filter for query invalidation. The `updateMatchResult` flow already handles auto-recalculation; extend to call tournament standings recalculation when `tournament_id` is present.

### Standings computation

| Operation | Notes |
|---|---|
| `calculateTournamentStandings(tournamentId)` | Mirror `calculateStandings` but filter by `tournament_id` |
| `generateInitialTournamentStandings(tournamentId)` | Mirror `generateInitialStandings` |

Reuse scoring logic from `standingsCalculator.ts` (2/1/0 points, sort by points → goal diff → goals scored).

### Blog attachment

- `updateTournament(id, { post_id })` — link to existing blog post.
- Public fetch: join `tournaments` with `blog_posts` when rendering.

### Public fetch by slug

- `fetchTournamentBySlug(slug)` — returns tournament metadata + teams + matches + standings in a single query (or parallel queries).
- Used by `src/app/(main)/tournaments/[slug]/page.tsx`.

---

## 5. UI/UX Flows

### Admin

**New page:** `src/app/admin/tournaments/page.tsx`

**Layout:** Tabbed interface (similar to how admin matches page uses category/season selectors):

#### Tab 1: Metadata
- Form fields: name, slug (auto-generated, editable), description, category (dropdown), season (dropdown), start_date, end_date, venue, image upload.
- Status selector: draft / published / archived.
- Save button.

#### Tab 2: Teams
- List of enrolled teams with seed order (drag-to-reorder or number input).
- "Add team" button → modal with team picker (filtered by tournament's category + season, from `club_category_teams`).
- Remove team button (with confirmation if matches exist).
- Validation: minimum 3 teams for round-robin.

#### Tab 3: Schedule (Matches)
- "Generate schedule" button → calls round-robin generator.
  - If matches exist: confirmation dialog with "wipe & regenerate" option.
- Match list grouped by round, showing home/away teams, date/time, venue.
- Each match row: click to open existing match edit modal (reuse `MatchFormModal` or similar).
- Result entry: reuse existing match result editing flow.
- Bulk actions: set date/time for all matches in a round.

#### Tab 4: Standings
- Reuse `UnifiedStandingTable` component.
- "Generate standings" and "Recalculate" buttons (same as existing league standings flow).
- Auto-recalculation after match results (via `autoRecalculateStandings` pattern).

#### Tab 5: Publication / Blog
- Link to blog post (dropdown of existing posts, or "Create new post" shortcut).
- Public link preview (shows slug-based URL).
- Publish toggle (changes status to `published`).

**Admin list page:** Table of all tournaments with filters (season, category, status). Click to open tournament detail (tabbed view above).

### Public

#### Tournament detail page: `src/app/(main)/tournaments/[slug]/page.tsx`
- **Header:** Tournament name, date(s), venue, category badge, description.
- **Schedule section:** Match list grouped by round. Each match shows teams, time, score (if completed). Reuse `MatchSchedule` component pattern.
- **Standings section:** Reuse `UnifiedStandingTable` (or the public `CategoryStandings` pattern).
- **Blog section:** If `post_id` is linked, show embedded blog content or link.

#### Homepage teaser
- "Upcoming tournaments" or "Latest tournament results" widget.
- Card with tournament name, date, category, venue, and link to detail page.
- Data source: fetch published tournaments, ordered by `start_date DESC`, limit 1–3.

#### Blog embed
- When a blog post is linked to a tournament, the blog post page can embed tournament schedule + standings.
- Component: `TournamentEmbed` — takes `tournament_id`, renders compact schedule + standings.
- Pattern: similar to how matches already link to blog posts via `post_id`.

---

## 6. Algorithm Notes

### Round-robin generation

For N teams, use the **circle method** (standard round-robin scheduling):
- N-1 rounds (if N is even) or N rounds (if N is odd, add a "bye").
- Each round: N/2 matches.
- Fix team 1, rotate remaining teams.
- Respect `seed_order` for initial positioning.

**Pairing example (6 teams):**
- 5 rounds, 3 matches per round = 15 total matches.
- Each pair plays exactly once.

**Implementation:**
- If N is odd, add a virtual "bye" team → that team's opponent in each round has a bye.
- Assign `round` number to each generated match.
- Home/away can alternate or be assigned by seed (higher seed = home in first meeting).

### Standings calculation

Reuse existing logic from `standingsCalculator.ts`:
1. **Points:** Win = 2, Draw = 1, Loss = 0.
2. **Sorting:** Points DESC → Goal difference DESC → Goals scored DESC.
3. **Tiebreaker:** If still tied, positions remain equal (admin can manually adjust if needed).

### Handling ties
- For display purposes, equal-ranked teams get the same position number.
- If manual tiebreaker is needed (e.g., head-to-head record), admin can manually edit positions in `tournament_standings`.

---

## 7. Risks & Edge Cases

| Risk | Mitigation |
|---|---|
| **Missing results** | Standings show "0" for unplayed matches; mark matches as "upcoming" until results entered. |
| **Time/date edits after generation** | Allow editing date/time on individual matches without regenerating schedule. |
| **Regeneration impacts** | If admin regenerates schedule, warn that existing results will be lost. Require explicit `wipeExisting: true`. |
| **Duplicate teams** | DB unique constraint `(tournament_id, team_id)` prevents duplicates. |
| **Publication states** | Only `published` tournaments visible to public. Draft tournaments invisible to anon users via RLS. |
| **Performance for embeds** | Persisted standings avoid recomputation. Add indexes on `tournament_id` for matches and standings queries. |
| **Team removal after matches exist** | Prevent removal if team has matches; require regeneration first. |
| **Blog post deletion** | If linked blog post is deleted, set `tournament.post_id = NULL` (cascade or trigger). |
| **Slug collisions** | Unique constraint + validation in form. Suggest alternatives on conflict. |
| **Concurrent result editing** | Supabase handles row-level locking; `updated_at` can be used for optimistic concurrency. |

---

## 8. Testing Plan

### Unit tests
- **Round-robin generator:** Verify correct number of matches for N teams (3, 4, 5, 6, 8). Verify each pair plays exactly once. Verify bye handling for odd N. Verify round assignment.
- **Standings calculation:** Verify points for W/D/L. Verify sorting (points, goal diff, goals scored). Verify handling of matches with no result (skipped).

### Integration / hook tests
- `useMatchMutations` with `tournament_id` — verify query invalidation includes tournament-scoped keys.
- Tournament CRUD mutations — verify create/update/delete via `createMutationHelpers`.
- Standings auto-recalculation on match result save.

### E2E happy path
1. Create tournament (metadata).
2. Add 4 teams.
3. Generate round-robin schedule (6 matches, 3 rounds).
4. Enter results for all matches.
5. Verify standings are correct.
6. Publish tournament.
7. Visit public page by slug — verify metadata, schedule, standings render.

### Negative cases
- Attempt to generate schedule with < 3 teams → error.
- Attempt to add duplicate team → error.
- Attempt to remove team with existing matches → error/warning.
- Attempt to regenerate without `wipeExisting` when matches exist → error.
- Public access to draft tournament → 404.
- Invalid slug → 404.

---

## 9. Delivery Plan & Time Estimates

> Estimates assume a single developer familiar with the codebase + Claude Code assistance.
> MD = man-day (≈ 6–7 productive hours). Total: **~13–18 MD**.

| Phase | Scope | Estimate | Depends on | Milestone | Detail |
|---|---|---|---|---|---|
| **1 — Foundation** | Migrations, types, translations | **1.5–2 MD** | — | DB ready, types compile | [Phase1_Foundation.md](Phase1_Foundation.md) |
| **2 — API / Hooks** | Queries, mutations, generator, standings calc | **2.5–3 MD** | Phase 1 | CRUD works, round-robin generates matches | [Phase2_API_Hooks.md](Phase2_API_Hooks.md) |
| **3 — Admin UI** | List page, detail page (5 tabs), modals | **4–5 MD** | Phase 2 | Admin can create → teams → generate → edit results | [Phase3_Admin_UI.md](Phase3_Admin_UI.md) |
| **4 — Standings / Live** | Auto-recalc, generate/recalculate buttons | **1–1.5 MD** | Phase 2–3 | Standings update on result entry | [Phase4_Standings_Live.md](Phase4_Standings_Live.md) |
| **5 — Public / Blog** | Slug page, homepage teaser, blog embed | **2–3 MD** | Phase 2–4 | Public can view published tournament | [Phase5_Public_Blog.md](Phase5_Public_Blog.md) |
| **6 — QA** | Unit, integration, e2e, cross-browser | **2–3 MD** | Phase 1–5 | All tests green, ready for release | [Phase6_QA.md](Phase6_QA.md) |
| *Future — Coach portal* | *Read-only views, result entry* | *1.5–2 MD* | *Phase 1–4* | *Coach can view & enter results* | — |

### Phase 1: Foundation (1.5–2 MD)

| Task | Est. | Notes |
|---|---|---|
| Migration: `tournaments` table + RLS | 0.3 MD | Follow grants migration pattern |
| Migration: `tournament_teams` table + RLS | 0.2 MD | Simple join table |
| Migration: `tournament_standings` table + RLS | 0.2 MD | Mirror `standings` structure |
| Migration: add `tournament_id`, `round` to `matches` | 0.2 MD | Nullable FK, index |
| Run `/db-sync`, generate schema types | 0.1 MD | Automated |
| Entity type files (tournament, tournamentTeam) | 0.2 MD | Follow convention |
| Translations (`src/lib/translations/tournaments.ts`) | 0.2 MD | Czech strings for all labels/actions/toasts |
| Tournament status enum | 0.1 MD | Follow `BlogPostStatuses` pattern |

### Phase 2: API / Hooks (2.5–3 MD)

| Task | Est. | Notes |
|---|---|---|
| `src/queries/tournaments/` (constants, queries, mutations) | 0.5 MD | `createMutationHelpers` factory |
| `src/queries/tournamentTeams/` (queries, mutations) | 0.3 MD | Team add/remove/reorder |
| `src/hooks/entities/tournament/` (fetch + CRUD hooks) | 0.5 MD | `createDataFetchHook` + `createCRUDHook` |
| Round-robin generator (`src/utils/roundRobinGenerator.ts`) | 0.5 MD | Circle method algorithm + unit tests |
| Tournament standings calculator | 0.3 MD | Adapt `standingsCalculator.ts` |
| Extend `useMatchMutations` for tournament context | 0.2 MD | Add `tournament_id` to invalidation |
| `fetchTournamentBySlug` public query | 0.2 MD | Follow `fetchBlogPostBySlug` |
| Barrel exports (`/generate-barrels`) | 0.1 MD | Automated |

### Phase 3: Admin UI (4–5 MD)

| Task | Est. | Notes |
|---|---|---|
| Tournament list page (table + filters) | 0.5 MD | `AdminContainer` + `UnifiedTable` |
| Detail page shell (tabbed `AdminContainer`) | 0.3 MD | 5-tab layout |
| Tab 1 — Metadata form | 0.5 MD | Name, slug, dates, venue, category, season, image |
| Tab 2 — Teams management | 0.8 MD | Team picker modal, seed reorder, add/remove |
| Tab 3 — Schedule (matches) | 1.0 MD | Generate button, match list by round, edit modal reuse |
| Tab 4 — Standings | 0.3 MD | Reuse `UnifiedStandingTable`, generate/recalc buttons |
| Tab 5 — Publication / Blog | 0.5 MD | Blog post linker, publish toggle, public URL preview |
| Admin sidebar entry + routing | 0.1 MD | Add to sidebar config |

### Phase 4: Standings / Live (1–1.5 MD)

| Task | Est. | Notes |
|---|---|---|
| Extend `autoRecalculateStandings` for tournaments | 0.4 MD | Detect `tournament_id` on match, recalc tournament standings |
| Generate initial tournament standings | 0.2 MD | Adapt `standingsGenerator` |
| Wire recalculate button in admin tab | 0.2 MD | Call calculator, refresh query |
| Verify end-to-end: result → standings update | 0.2 MD | Manual + automated test |

### Phase 5: Public / Blog (2–3 MD)

| Task | Est. | Notes |
|---|---|---|
| Public page: `(main)/tournaments/[slug]/page.tsx` | 1.0 MD | SSR, metadata, schedule, standings sections |
| Homepage teaser component | 0.5 MD | Card with latest/upcoming tournament |
| `TournamentEmbed` component | 0.5 MD | Compact schedule + standings for blog pages |
| Blog post integration (detect linked tournament) | 0.3 MD | Extend blog `[slug]` page |
| API route for public tournament fetch | 0.2 MD | `withPublicAccess` wrapper |
| `generateStaticParams` + ISR config | 0.2 MD | Follow blog pattern |

### Phase 6: QA (2–3 MD)

| Task | Est. | Notes |
|---|---|---|
| Unit tests: round-robin generator | 0.5 MD | Edge cases: 3–12 teams, odd/even, bye |
| Unit tests: tournament standings calculator | 0.3 MD | W/D/L scoring, sort order, ties |
| Integration tests: CRUD hooks & mutations | 0.5 MD | Create, update, delete, query invalidation |
| E2E: admin happy path (create → publish) | 0.5 MD | Full lifecycle |
| E2E: public page rendering | 0.3 MD | Slug access, 404 for draft, SEO |
| Cross-browser / mobile testing | 0.3 MD | Responsive tables, mobile schedule |
| Bug fixes & polish | 0.5 MD | Buffer for discovered issues |

### Future: Coach portal (1.5–2 MD)

| Task | Est. | Notes |
|---|---|---|
| Coach tournament list (filtered by assigned categories) | 0.5 MD | Read-only, reuse list components |
| Coach result entry for tournament matches | 0.5 MD | Reuse `CoachMatchResultFlow` |
| RLS policies for coach role | 0.3 MD | Category-scoped access |
| Testing | 0.3 MD | Role-based access verification |

---

## 10. Dependencies & TODOs

### Required decisions
1. **Persisted standings:** Recommended YES (see §2). Confirm with stakeholder.
2. **Slug rules:** Auto-generated from name, editable by admin, unique constraint. Use same `slugify` as blog posts.
3. **Blog linkage:** Tournament has `post_id` (FK to `blog_posts`). Blog post page checks if any tournament references it and renders embed. Alternatively, blog post could have `tournament_id` — recommend keeping the FK on tournament side for simplicity.
4. **Points system:** 2/1/0 (matching existing standings). Confirm no tournament-specific variation needed.
5. **Max teams:** Any practical limit? Round-robin with 12+ teams generates 66+ matches — verify this is acceptable.

### Blocked items
- None strictly blocked. Phase 1 (migrations) can start immediately.

### Existing assets to reuse
| Asset | Location | Reuse strategy |
|---|---|---|
| `createMutationHelpers` | `src/queries/shared/createMutationHelpers.ts` | Tournament CRUD mutations |
| `createDataFetchHook` | `src/hooks/factories/createDataFetchHook.ts` | `useFetchTournaments` |
| `createCRUDHook` | `src/hooks/factories/createCRUDHook.ts` | `useTournament` |
| `useMatchMutations` | `src/hooks/entities/match/state/useMatchMutations.ts` | Extend for tournament matches |
| `standingsCalculator` | `src/utils/standingsCalculator.ts` | Base for tournament standings calc |
| `standingsGenerator` | `src/utils/standingsGenerator.ts` | Pattern for initial standings |
| `UnifiedStandingTable` | `src/components/shared/standing-table/UnifiedStandingTable.tsx` | Public + admin standings display |
| `MatchSchedule` | `src/components/shared/match/MatchSchedule.tsx` | Public schedule display |
| `CompetitionTypes.TOURNAMENT` | `src/enums/competitionTypes.ts` | Already exists |
| `BlogPostStatuses` | `src/enums/blogPostStatutes.ts` | Pattern for tournament status enum |
| `fetchBlogPostBySlug` | `src/queries/blogPosts/queries.ts` | Pattern for `fetchTournamentBySlug` |
| Blog `[slug]` page | `src/app/(main)/blog/[slug]/page.tsx` | Pattern for tournament public page |
| RLS policies | `scripts/migrations/20251015_create_grants_table.sql` | Pattern for tournament RLS |
| `autoRecalculateStandings` | `src/utils/autoStandingsRecalculation.ts` | Extend for tournament context |
| `QueryContext` pattern | `src/queries/shared/types.ts` | All tournament queries |