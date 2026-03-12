# Phase 3 — Admin UI

> **Estimate:** 4–5 MD | **Depends on:** Phase 2 | **Milestone:** Admin can create → teams → generate → edit results
>
> Parent: [Tournaments_Analysis_Report.md](Tournaments_Analysis_Report.md)

---

## Checklist

- [x] 3.1 Admin sidebar entry + routing
- [x] 3.2 Tournament list page (table + filters)
- [x] 3.3 Tournament detail page shell (tabbed AdminContainer)
- [x] 3.4 Tab 1 — Metadata form
- [ ] 3.5 Tab 2 — Teams management
- [ ] 3.6 Tab 3 — Schedule (matches)
- [ ] 3.7 Tab 4 — Standings
- [ ] 3.8 Tab 5 — Publication / Blog
- [ ] 3.9 Verify: `npm run tsc && npm run lint`

---

## 3.1 Admin sidebar entry + routing (0.1 MD)

### Navigation config

**File:** `src/lib/navigation.ts`

Add to `allRoutes` array in the appropriate `RouteGroups.TEAM` group:

```typescript
{
  href: APP_ROUTES.admin.tournaments,
  title: translations.tournaments.page.title,    // "Turnaje"
  isPrivate: true,
  description: translations.tournaments.page.description,
  group: RouteGroups.TEAM,
  icon: TrophyIcon,    // from @heroicons/react/24/outline
},
```

### App routes

**File:** `src/lib/routes.ts` (or wherever `APP_ROUTES` is defined)

Add:
```typescript
admin: {
  // ... existing ...
  tournaments: '/admin/tournaments',
  tournamentDetail: (id: string) => `/admin/tournaments/${id}`,
}
```

---

## 3.2 Tournament list page (0.5 MD)

### File structure

```
src/app/admin/tournaments/
  page.tsx                          ← Server component (prefetch + HydrationBoundary)
  TournamentsPageClient.tsx         ← Client component (main UI)
  components/
    TournamentFormModal.tsx         ← Create/edit tournament modal
    index.ts                        ← Barrel
```

### `page.tsx` — Server component

**Reference:** `src/app/admin/committees/page.tsx`

```typescript
import {HydrationBoundary} from '@tanstack/react-query';
import {prefetchQuery} from '@/utils/prefetch';
import TournamentsPageClient from './TournamentsPageClient';

export default async function TournamentsAdminPage() {
  const dehydratedState = await prefetchQuery(['tournaments'], fetchTournaments);

  return (
    <HydrationBoundary state={dehydratedState}>
      <TournamentsPageClient />
    </HydrationBoundary>
  );
}
```

### `TournamentsPageClient.tsx` — Client component

Key elements:
- `AdminContainer` with title, description, icon, actions
- `UnifiedTable` with tournament data
- Filter by season/category/status (using `AdminFilters`)
- Click row → navigate to detail page

```typescript
'use client';

import {TrophyIcon} from '@heroicons/react/24/outline';
import {useRouter} from 'next/navigation';

import {AdminContainer, UnifiedTable} from '@/components';
import {useFetchTournaments, useTournaments} from '@/hooks';
import {translations} from '@/lib/translations';
import {ActionTypes} from '@/enums';

const t = translations.tournaments;

export default function TournamentsPageClient() {
  const router = useRouter();
  const {data: tournaments, loading, refetch} = useFetchTournaments();
  const {createTournament, deleteTournament} = useTournaments();
  const modal = useModal();

  const actions = [
    {
      label: t.addTournament,
      onClick: () => modal.onOpen(),
      buttonType: ActionTypes.CREATE,
      priority: 'primary' as const,
    },
  ];

  return (
    <AdminContainer
      title={t.page.title}
      description={t.page.description}
      icon={<TrophyIcon className="w-6 h-6" />}
      actions={actions}
      loading={loading}
    >
      <UnifiedTable
        data={tournaments}
        columns={columns}
        renderCell={renderCell}
        ariaLabel={t.table.ariaLabel}
        onRowAction={(id) => router.push(`/admin/tournaments/${id}`)}
      />
      {/* TournamentFormModal for create */}
    </AdminContainer>
  );
}
```

### Table columns

```typescript
const columns = [
  {key: 'name', label: t.table.name},
  {key: 'category', label: t.table.category},
  {key: 'date', label: t.table.date},
  {key: 'teams', label: t.table.teams, align: 'center'},
  {key: 'status', label: t.table.status},
  {key: 'actions', label: t.table.actions},
];
```

### `TournamentFormModal.tsx`

Uses `Dialog` component for create/edit:

```typescript
<Dialog
  isOpen={isOpen}
  onClose={onClose}
  title={mode === 'add' ? t.modal.addTitle : t.modal.editTitle}
  onSubmit={handleSubmit}
  size="lg"
>
  <VStack spacing={4}>
    <Input label={t.labels.name} value={formData.name} onChange={...} isRequired />
    <Input label={t.labels.slug} value={formData.slug} onChange={...} description={t.placeholders.slug} />
    <HStack spacing={4}>
      <Select label={t.labels.category} ... />
      <Select label={t.labels.season} ... />
    </HStack>
    <HStack spacing={4}>
      <Input type="date" label={t.labels.startDate} ... isRequired />
      <Input type="date" label={t.labels.endDate} ... />
    </HStack>
    <Input label={t.labels.venue} ... />
    <Textarea label={t.labels.description} ... />
  </VStack>
</Dialog>
```

---

## 3.3 Tournament detail page shell (0.3 MD)

### File structure

```
src/app/admin/tournaments/[id]/
  page.tsx                          ← Client component with tabs
  components/
    MetadataTab.tsx
    TeamsTab.tsx
    ScheduleTab.tsx
    StandingsTab.tsx
    PublicationTab.tsx
    index.ts
```

### `page.tsx` — Tabbed detail page

**Reference:** `src/app/admin/clubs/[id]/page.tsx`

```typescript
'use client';

import {useState} from 'react';
import {useParams} from 'next/navigation';
import {TrophyIcon} from '@heroicons/react/24/outline';

import {AdminContainer} from '@/components';
import {translations} from '@/lib/translations';

import {MetadataTab, TeamsTab, ScheduleTab, StandingsTab, PublicationTab} from './components';

const t = translations.tournaments;

const TABS = [
  {key: 'metadata', title: t.tabs.metadata},
  {key: 'teams', title: t.tabs.teams},
  {key: 'schedule', title: t.tabs.schedule},
  {key: 'standings', title: t.tabs.standings},
  {key: 'publication', title: t.tabs.publication},
];

export default function TournamentDetailPage() {
  const {id} = useParams<{id: string}>();
  const [activeTab, setActiveTab] = useState('metadata');

  // Fetch tournament data
  // const {data: tournament, loading} = useFetchTournament(id);

  const tabs = TABS.map((tab) => ({
    ...tab,
    content: renderTabContent(tab.key, id),
  }));

  return (
    <AdminContainer
      title={tournament?.name || t.page.title}
      description={t.page.description}
      icon={<TrophyIcon className="w-6 h-6" />}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(key) => setActiveTab(key as string)}
      loading={loading}
    />
  );
}

function renderTabContent(tabKey: string, tournamentId: string) {
  switch (tabKey) {
    case 'metadata': return <MetadataTab tournamentId={tournamentId} />;
    case 'teams': return <TeamsTab tournamentId={tournamentId} />;
    case 'schedule': return <ScheduleTab tournamentId={tournamentId} />;
    case 'standings': return <StandingsTab tournamentId={tournamentId} />;
    case 'publication': return <PublicationTab tournamentId={tournamentId} />;
  }
}
```

---

## 3.4 Tab 1 — Metadata form (0.5 MD)

**File:** `src/app/admin/tournaments/[id]/components/MetadataTab.tsx`

### Responsibilities
- Display/edit tournament metadata
- Auto-generate slug from name (with manual override)
- Category and season dropdowns (reuse `useFetchCategories`, `useFetchSeasons`)
- Status selector (draft/published/archived)
- Image upload (if image_url is supported)
- Save button

### Props

```typescript
interface MetadataTabProps {
  tournamentId: string;
}
```

### Form fields

| Field | Component | Source | Required |
|---|---|---|---|
| name | `Input` | user input | yes |
| slug | `Input` (auto-generated) | derived from name | yes |
| description | `Textarea` | user input | no |
| category_id | `Select` | `useFetchCategories` | yes |
| season_id | `Select` | `useFetchSeasons` | yes |
| start_date | `Input type="date"` | user input | yes |
| end_date | `Input type="date"` | user input | no |
| venue | `Input` | user input | no |
| status | `Select` | `getTournamentStatusOptions()` | yes |
| image_url | Image upload component | user upload | no |

### Slug auto-generation

```typescript
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};
```

---

## 3.5 Tab 2 — Teams management (0.8 MD)

**File:** `src/app/admin/tournaments/[id]/components/TeamsTab.tsx`

### Responsibilities
- List enrolled teams with seed order
- Add team button → modal with team picker
- Remove team button (with confirmation if matches exist)
- Reorder seeds (number input or drag-and-drop)
- Show validation: minimum 3 teams badge

### Team picker modal

- Filtered by tournament's `category_id` + `season_id`
- Fetches from `club_category_teams` via `club_categories`
- Excludes already-enrolled teams
- Shows club name + team suffix + logo

### Team list

```typescript
<ContentCard title={t.labels.teams} actions={[{label: t.actions.addTeam, onClick: openPicker}]}>
  {teams.length < 3 && (
    <Alert color="warning">{t.validation.minTeams}</Alert>
  )}
  <UnifiedTable
    data={teams}
    columns={[
      {key: 'seedOrder', label: '#', align: 'center'},
      {key: 'team', label: t.labels.teams},
      {key: 'actions', label: t.table.actions},
    ]}
    renderCell={renderTeamCell}
  />
</ContentCard>
```

### Seed reorder

Each team row has a numeric `Input` for seed order. On change, calls `updateSeedOrders()`. Alternatively, consider drag-and-drop if a library is available.

---

## 3.6 Tab 3 — Schedule / Matches (1.0 MD)

**File:** `src/app/admin/tournaments/[id]/components/ScheduleTab.tsx`

This is the most complex tab. Handles schedule generation and match editing.

### Responsibilities
- "Generate schedule" button (calls `generateTournamentSchedule`)
- Regeneration confirmation dialog (warns about data loss)
- Match list grouped by round
- Click match → open edit modal (reuse existing match editing components)
- Result entry per match
- Bulk set date/time per round

### UI structure

```
┌─────────────────────────────────────────────────┐
│ [Generate Schedule] [Regenerate ▾]              │
├─────────────────────────────────────────────────┤
│ Kolo 1                                          │
│  ┌──────────────────────────────────────────┐   │
│  │ Team A vs Team B  │ 10:00 │ - : - │ [✏️] │   │
│  │ Team C vs Team D  │ 10:45 │ 5 : 3 │ [✏️] │   │
│  │ Team E vs Team F  │ 11:30 │ - : - │ [✏️] │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│ Kolo 2                                          │
│  ┌──────────────────────────────────────────┐   │
│  │ ...                                      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Generate schedule flow

```typescript
const handleGenerate = async () => {
  if (existingMatches.length > 0) {
    // Show confirmation dialog
    regenerateModal.onOpen();
    return;
  }
  await generateTournamentSchedule(tournamentId, {wipeExisting: false});
  await refetchMatches();
  showToast.success(t.responseMessages.scheduleGenerated);
};

const handleRegenerate = async () => {
  await generateTournamentSchedule(tournamentId, {wipeExisting: true});
  await refetchMatches();
  regenerateModal.onClose();
  showToast.success(t.responseMessages.scheduleGenerated);
};
```

### Match editing

Reuse existing match result editing pattern from `useMatchMutations`:

```typescript
const matchMutations = useMatchMutations({
  selectedCategory: tournament.category_id,
  selectedSeason: tournament.season_id,
  tournamentId: tournamentId,
  onStandingsRefresh: refetchStandings,
});
```

For result entry, reuse `MatchResultInput` component or `AddResultModal` pattern.

### Grouping matches by round

```typescript
const matchesByRound = useMemo(() => {
  const grouped = new Map<number, Match[]>();
  matches.forEach((match) => {
    const round = match.round ?? 0;
    if (!grouped.has(round)) grouped.set(round, []);
    grouped.get(round)!.push(match);
  });
  return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
}, [matches]);
```

---

## 3.7 Tab 4 — Standings (0.3 MD)

**File:** `src/app/admin/tournaments/[id]/components/StandingsTab.tsx`

### Responsibilities
- Display standings using `UnifiedStandingTable`
- "Generate standings" button (initial creation)
- "Recalculate" button (re-compute from match results)
- Auto-refresh after match results change

### Implementation

```typescript
export function StandingsTab({tournamentId}: {tournamentId: string}) {
  const {standings, loading, fetchStandings} = useTournamentStandings(tournamentId);

  const handleGenerate = async () => {
    await generateInitialTournamentStandings(tournamentId);
    await fetchStandings();
    showToast.success(t.responseMessages.standingsGenerated);
  };

  const handleRecalculate = async () => {
    const result = await calculateTournamentStandings(tournamentId);
    if (result.success) {
      await fetchStandings();
      showToast.success(t.responseMessages.standingsRecalculated);
    }
  };

  return (
    <ContentCard
      title={t.tabs.standings}
      actions={[
        {label: t.actions.generateStandings, onClick: handleGenerate},
        {label: t.actions.recalculateStandings, onClick: handleRecalculate},
      ]}
    >
      <UnifiedStandingTable
        standings={standings}
        loading={loading}
        emptyContent={<EmptyState type="standings" title={t.public.noStandings} />}
      />
    </ContentCard>
  );
}
```

---

## 3.8 Tab 5 — Publication / Blog (0.5 MD)

**File:** `src/app/admin/tournaments/[id]/components/PublicationTab.tsx`

### Responsibilities
- Link/unlink blog post (dropdown of existing published posts)
- "Create new blog post" shortcut
- Publish/unpublish toggle (changes tournament status)
- Public URL preview (shows `/tournaments/{slug}`)

### UI structure

```
┌─────────────────────────────────────────────────┐
│ Stav: [Koncept ▾]                               │
│                                                 │
│ Veřejný odkaz:                                  │
│ https://...../tournaments/velikonocni-turnaj-2026│
│ [Kopírovat odkaz]                               │
│                                                 │
│ Propojený článek:                               │
│ [Vyberte článek ▾]  nebo  [Vytvořit nový]       │
│                                                 │
│ [Publikovat turnaj]                              │
└─────────────────────────────────────────────────┘
```

### Publish flow

```typescript
const handlePublish = async () => {
  await updateTournament(tournamentId, {status: 'published'});
  showToast.success(t.responseMessages.published);
};

const handleUnpublish = async () => {
  await updateTournament(tournamentId, {status: 'draft'});
  showToast.success(t.responseMessages.unpublished);
};
```

---

## 3.9 Verification

```bash
npm run tsc
npm run lint
```

### Manual testing checklist

- [ ] Sidebar shows "Turnaje" entry
- [ ] List page loads and shows empty state
- [ ] Create tournament via modal → appears in list
- [ ] Click tournament → detail page with 5 tabs
- [ ] Metadata tab: edit + save works
- [ ] Teams tab: add/remove teams, seed reorder
- [ ] Schedule tab: generate matches, view by round
- [ ] Schedule tab: edit match result → standings update
- [ ] Standings tab: generate, recalculate
- [ ] Publication tab: publish, unpublish, blog link

---

## Expected file tree after Phase 3

```
src/app/admin/tournaments/
  page.tsx
  TournamentsPageClient.tsx
  [id]/
    page.tsx
    components/
      MetadataTab.tsx
      TeamsTab.tsx
      ScheduleTab.tsx
      StandingsTab.tsx
      PublicationTab.tsx
      TournamentFormModal.tsx
      index.ts

src/lib/navigation.ts          ← updated (sidebar entry)
src/lib/routes.ts              ← updated (APP_ROUTES)
```

---

## Key components to reuse

| Existing component | Used in | Purpose |
|---|---|---|
| `AdminContainer` | Detail page shell | Tabbed layout with actions |
| `UnifiedTable` | List page, teams tab, schedule tab | Data tables |
| `Dialog` | Create/edit modal | Form-based modals |
| `DeleteConfirmationModal` | Remove team, delete tournament | Destructive action confirmation |
| `UnifiedStandingTable` | Standings tab | Standings display |
| `MatchResultInput` | Schedule tab | Score entry per match |
| `ContentCard` | Tab content wrappers | Card sections |
| `EmptyState` | All tabs | "No data" placeholders |
| `Select` / `Input` / `Textarea` | Metadata form | Form inputs (HeroUI) |
| `useModal` / `useModalWithItem` | Modals | Modal state management |
