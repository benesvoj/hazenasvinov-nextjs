# Phase 1 — Foundation (Migrations, Types, Translations)

> **Estimate:** 1.5–2 MD | **Depends on:** nothing | **Milestone:** DB ready, types compile
>
> Parent: [Tournaments_Analysis_Report.md](Tournaments_Analysis_Report.md)

---

## Checklist

- [ ] 1.1 Migration: `tournaments` table + RLS
- [ ] 1.2 Migration: `tournament_teams` table + RLS
- [ ] 1.3 Migration: `tournament_standings` table + RLS
- [ ] 1.4 Migration: add `tournament_id`, `round` to `matches`
- [ ] 1.5 Run `/db-sync`, generate schema types
- [ ] 1.6 Entity type files (tournament, tournamentTeam)
- [ ] 1.7 Tournament status enum
- [ ] 1.8 Translations (`src/lib/translations/tournaments.ts`)
- [ ] 1.9 Register translations in index
- [ ] 1.10 Verify: `npm run tsc && npm run lint`

---

## 1.1 Migration: `tournaments` table + RLS (0.3 MD)

**File:** `scripts/migrations/20260312_create_tournaments_table.sql`

**Reference pattern:** `scripts/migrations/20251015_create_grants_table.sql`

### Table structure

```sql
-- =====================================================
-- Tournaments Table
-- Created: 2026-03-12
-- Purpose: Store tournament metadata for round-robin tournaments
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    venue TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    post_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournaments_slug ON public.tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_tournaments_category_season ON public.tournaments(category_id, season_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
```

### RLS policies

Follow the grants table pattern — admin full CRUD, public read published only.

```sql
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "Admins can view all tournaments"
    ON public.tournaments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert tournaments"
    ON public.tournaments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update tournaments"
    ON public.tournaments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete tournaments"
    ON public.tournaments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

-- Public: read published only
CREATE POLICY "Anyone can view published tournaments"
    ON public.tournaments FOR SELECT
    USING (status = 'published');
```

### Trigger: auto-update `updated_at`

```sql
CREATE OR REPLACE FUNCTION public.update_tournaments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tournaments_updated_at ON public.tournaments;
CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON public.tournaments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tournaments_updated_at();
```

### Permissions & comments

```sql
GRANT SELECT ON public.tournaments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;

COMMENT ON TABLE public.tournaments IS 'Round-robin tournaments';
COMMENT ON COLUMN public.tournaments.slug IS 'URL-safe identifier, auto-generated from name';
COMMENT ON COLUMN public.tournaments.status IS 'draft | published | archived';
```

---

## 1.2 Migration: `tournament_teams` table + RLS (0.2 MD)

**File:** `scripts/migrations/20260312_create_tournament_teams_table.sql`

### Table structure

```sql
CREATE TABLE IF NOT EXISTS public.tournament_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.club_category_teams(id) ON DELETE CASCADE,
    seed_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tournament_team UNIQUE (tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_teams_tournament ON public.tournament_teams(tournament_id);
```

### RLS policies

```sql
ALTER TABLE public.tournament_teams ENABLE ROW LEVEL SECURITY;

-- Admin: full CRUD (same pattern as tournaments)
-- Public: read only if parent tournament is published
CREATE POLICY "Anyone can view teams of published tournaments"
    ON public.tournament_teams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tournaments
            WHERE tournaments.id = tournament_teams.tournament_id
            AND tournaments.status = 'published'
        )
    );
```

Plus admin SELECT/INSERT/UPDATE/DELETE policies (same `user_profiles.role = 'admin'` pattern).

---

## 1.3 Migration: `tournament_standings` table + RLS (0.2 MD)

**File:** `scripts/migrations/20260312_create_tournament_standings_table.sql`

**Reference:** Existing `standings` table structure from `src/types/database/supabase.ts`.

### Table structure

```sql
CREATE TABLE IF NOT EXISTS public.tournament_standings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.club_category_teams(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    matches INT NOT NULL DEFAULT 0,
    wins INT NOT NULL DEFAULT 0,
    draws INT NOT NULL DEFAULT 0,
    losses INT NOT NULL DEFAULT 0,
    goals_for INT NOT NULL DEFAULT 0,
    goals_against INT NOT NULL DEFAULT 0,
    points INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tournament_standing UNIQUE (tournament_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_tournament_standings_tournament ON public.tournament_standings(tournament_id);
```

### RLS policies

Same pattern as `tournament_teams`:
- Admin: full CRUD
- Public: read if parent tournament is published (join through `tournaments.status`)

---

## 1.4 Migration: add `tournament_id`, `round` to `matches` (0.2 MD)

**File:** `scripts/migrations/20260312_add_tournament_fields_to_matches.sql`

```sql
-- =====================================================
-- Add tournament support to matches table
-- Created: 2026-03-12
-- Purpose: Allow matches to belong to a tournament
-- =====================================================

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS round INT;

CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches(tournament_id);

COMMENT ON COLUMN public.matches.tournament_id IS 'FK to tournaments; NULL for league matches';
COMMENT ON COLUMN public.matches.round IS 'Round number within tournament; NULL for league matches';
```

**Note:** No RLS changes needed — existing `matches` RLS policies continue to apply. Tournament matches are just regular matches with `tournament_id IS NOT NULL`.

---

## 1.5 Run `/db-sync`, generate schema types (0.1 MD)

After applying all migrations:

1. Run migrations against Supabase
2. Run `/db-sync` skill to regenerate TypeScript types
3. This auto-generates:
   - `src/types/entities/tournament/schema/tournamentsSchema.ts`
   - `src/types/entities/tournamentTeam/schema/tournamentTeamsSchema.ts`
   - `src/types/entities/tournamentStanding/schema/tournamentStandingsSchema.ts`
   - Updates `src/types/entities/match/schema/matchesSchema.ts` (adds `tournament_id`, `round`)

### Expected generated schema (tournaments)

```typescript
/**
 * Database schema for `tournaments` table
 *
 * ⚠️ AUTO-GENERATED - DO NOT EDIT MANUALLY
 */

export interface TournamentSchema {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  season_id: string | null;
  start_date: string;
  end_date: string | null;
  venue: string | null;
  status: string;
  post_id: string | null;
  image_url: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type TournamentInsert = Omit<TournamentSchema, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export type TournamentUpdate = {
  id: string;
} & Partial<Omit<TournamentSchema, 'id' | 'created_at' | 'updated_at'>>;
```

---

## 1.6 Entity type files (0.2 MD)

### Tournament domain type

**File:** `src/types/entities/tournament/data/tournament.ts`

**Reference:** `src/types/entities/blog/data/blog.ts`

```typescript
import {
  TournamentInsert,
  TournamentSchema,
  TournamentUpdate,
} from '@/types/entities/tournament/schema/tournamentsSchema';

export interface Tournament extends TournamentSchema {}

export interface CreateTournament extends TournamentInsert {}

export interface UpdateTournament extends TournamentUpdate {}

export type TournamentFormData = Omit<Tournament, 'id' | 'created_at' | 'updated_at'>;
```

### TournamentTeam domain type

**File:** `src/types/entities/tournamentTeam/data/tournamentTeam.ts`

```typescript
import {
  TournamentTeamInsert,
  TournamentTeamSchema,
  TournamentTeamUpdate,
} from '@/types/entities/tournamentTeam/schema/tournamentTeamsSchema';

export interface TournamentTeam extends TournamentTeamSchema {}

export interface CreateTournamentTeam extends TournamentTeamInsert {}

export interface UpdateTournamentTeam extends TournamentTeamUpdate {}
```

---

## 1.7 Tournament status enum (0.1 MD)

**File:** `src/enums/tournamentStatuses.ts`

**Reference:** `src/enums/blogPostStatutes.ts`

```typescript
import {translations} from '@/lib/translations';

const t = translations.tournaments.enums.statuses;

export enum TournamentStatuses {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export const TOURNAMENT_STATUSES: Record<TournamentStatuses, string> = {
  [TournamentStatuses.DRAFT]: t.draft,
  [TournamentStatuses.PUBLISHED]: t.published,
  [TournamentStatuses.ARCHIVED]: t.archived,
} as const;

export const getTournamentStatusOptions = () =>
  Object.entries(TOURNAMENT_STATUSES).map(([value, label]) => ({
    value: value as TournamentStatuses,
    label,
  }));
```

**Don't forget:** Add export to `src/enums/index.ts`.

---

## 1.8 Translations (0.2 MD)

**File:** `src/lib/translations/tournaments.ts`

**Reference:** `src/lib/translations/blogPosts.ts` structure

```typescript
export const tournamentsTranslations = {
  page: {
    title: 'Turnaje',
    description: 'Správa turnajů a soutěží klubu.',
  },
  addTournament: 'Nový turnaj',
  editTournament: 'Upravit turnaj',
  deleteTournament: 'Smazat turnaj',
  labels: {
    name: 'Název turnaje',
    slug: 'Slug (URL)',
    description: 'Popis',
    category: 'Kategorie',
    season: 'Sezóna',
    startDate: 'Datum začátku',
    endDate: 'Datum konce',
    venue: 'Místo konání',
    status: 'Stav',
    teams: 'Týmy',
    seedOrder: 'Pořadí nasazení',
    round: 'Kolo',
    schedule: 'Rozpis',
    standings: 'Tabulka',
    publication: 'Publikace',
    blogPost: 'Článek',
    publicLink: 'Veřejný odkaz',
  },
  placeholders: {
    name: 'Zadejte název turnaje',
    slug: 'automaticky generováno',
    description: 'Popis turnaje (volitelné)',
    category: 'Vyberte kategorii',
    season: 'Vyberte sezónu',
    venue: 'Místo konání turnaje',
  },
  table: {
    ariaLabel: 'Seznam turnajů',
    name: 'Název',
    category: 'Kategorie',
    season: 'Sezóna',
    date: 'Datum',
    status: 'Stav',
    teams: 'Týmů',
    actions: 'Akce',
  },
  tabs: {
    metadata: 'Základní údaje',
    teams: 'Týmy',
    schedule: 'Rozpis zápasů',
    standings: 'Tabulka',
    publication: 'Publikace',
  },
  actions: {
    addTeam: 'Přidat tým',
    removeTeam: 'Odebrat tým',
    generateSchedule: 'Generovat rozpis',
    regenerateSchedule: 'Přegenerovat rozpis',
    generateStandings: 'Generovat tabulku',
    recalculateStandings: 'Přepočítat tabulku',
    publish: 'Publikovat',
    unpublish: 'Zrušit publikaci',
    linkBlogPost: 'Propojit s článkem',
  },
  modal: {
    addTitle: 'Přidat turnaj',
    addSubtitle: 'Vytvořte nový turnaj',
    editTitle: 'Upravit turnaj',
    editSubtitle: 'Upravte existující turnaj',
    deleteTitle: 'Smazat turnaj',
    deleteMessage: 'Opravdu chcete smazat turnaj? Tato akce je nevratná.',
    addTeamTitle: 'Přidat tým do turnaje',
    removeTeamTitle: 'Odebrat tým',
    removeTeamMessage: 'Opravdu chcete odebrat tým z turnaje?',
    regenerateTitle: 'Přegenerovat rozpis',
    regenerateMessage: 'Přegenerování smaže všechny stávající zápasy a výsledky. Pokračovat?',
  },
  validation: {
    nameRequired: 'Název je povinný',
    categoryRequired: 'Kategorie je povinná',
    seasonRequired: 'Sezóna je povinná',
    startDateRequired: 'Datum začátku je povinné',
    minTeams: 'Turnaj vyžaduje alespoň 3 týmy',
    duplicateTeam: 'Tento tým je již v turnaji',
  },
  enums: {
    statuses: {
      draft: 'Koncept',
      published: 'Publikováno',
      archived: 'Archivováno',
      all: 'Všechny stavy',
    },
  },
  responseMessages: {
    createSuccess: 'Turnaj byl úspěšně vytvořen.',
    updateSuccess: 'Turnaj byl úspěšně aktualizován.',
    deleteSuccess: 'Turnaj byl úspěšně smazán.',
    createError: 'Chyba při vytváření turnaje.',
    updateError: 'Chyba při aktualizaci turnaje.',
    deleteError: 'Chyba při mazání turnaje.',
    fetchFailed: 'Chyba při načítání turnajů.',
    teamAdded: 'Tým byl přidán do turnaje.',
    teamRemoved: 'Tým byl odebrán z turnaje.',
    scheduleGenerated: 'Rozpis zápasů byl vygenerován.',
    scheduleRegenerateWarning: 'Stávající zápasy a výsledky budou smazány.',
    standingsGenerated: 'Tabulka byla vygenerována.',
    standingsRecalculated: 'Tabulka byla přepočítána.',
    published: 'Turnaj byl publikován.',
    unpublished: 'Publikace turnaje byla zrušena.',
  },
  public: {
    schedule: 'Rozpis zápasů',
    standings: 'Výsledková tabulka',
    noMatches: 'Žádné zápasy',
    noStandings: 'Tabulka zatím není k dispozici',
    teaser: 'Nadcházející turnaje',
  },
};
```

---

## 1.9 Register translations in index

**File:** `src/lib/translations/index.ts` — **manual update**

Add import and registration:

```typescript
import {tournamentsTranslations} from './tournaments';

export const translations = {
  // ... existing entries ...
  tournaments: tournamentsTranslations,
} as const;
```

---

## 1.10 Verification

Run before moving to Phase 2:

```bash
npm run tsc        # TypeScript compiles without errors
npm run lint       # ESLint passes
```

### Expected file tree after Phase 1

```
scripts/migrations/
  20260312_create_tournaments_table.sql
  20260312_create_tournament_teams_table.sql
  20260312_create_tournament_standings_table.sql
  20260312_add_tournament_fields_to_matches.sql

src/types/entities/tournament/
  schema/tournamentsSchema.ts          ← auto-generated
  data/tournament.ts                   ← manual

src/types/entities/tournamentTeam/
  schema/tournamentTeamsSchema.ts      ← auto-generated
  data/tournamentTeam.ts               ← manual

src/enums/tournamentStatuses.ts        ← manual

src/lib/translations/tournaments.ts    ← manual
src/lib/translations/index.ts          ← updated manually
```

---

## Decision log

| Decision | Choice | Rationale |
|---|---|---|
| Separate migration files vs one file | 4 separate files | Easier to review, rollback individually |
| `ON DELETE CASCADE` on tournament_teams | Yes | Teams should be removed when tournament is deleted |
| `ON DELETE SET NULL` on matches.tournament_id | Yes | Keep match history even if tournament is deleted |
| `ON DELETE SET NULL` on tournaments.post_id | Yes | Don't delete tournament if blog post is removed |
| Standings NOT NULL defaults vs nullable | NOT NULL DEFAULT 0 | Simpler logic, no null checks needed |
| Status as TEXT vs enum type | TEXT with app-level enum | Consistent with existing `blog_posts.status` pattern |
