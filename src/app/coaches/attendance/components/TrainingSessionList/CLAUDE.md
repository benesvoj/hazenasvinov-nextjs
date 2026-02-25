# TrainingSessionList Component

## Purpose

Displays a selectable list of training sessions within the Attendance page. Coaches use this list to pick a session, then record per-member attendance in the adjacent `AttendanceRecordingTable`. Also provides quick actions: change status, edit, and delete.

## Current File

| File | Lines | Status |
|---|---|---|
| `TrainingSessionList.tsx` | 145 | Clean — no lint/TS issues, all strings via translations |

## Props

```typescript
interface TrainingSessionListProps {
  loading: boolean;
  sessions: BaseTrainingSession[];           // Pre-fetched, sorted by session_date DESC
  selectedSession: string | null;            // Currently selected session ID
  onStatusChange: (session: BaseTrainingSession) => void;
  onSelectedSession: (sessionId: string | null) => void;
  onEditSession: (session: BaseTrainingSession) => void;
  onDeleteSession: (sessionId: string) => void;
}
```

## Current Rendering

- **Loading:** 3 skeleton placeholders
- **Empty:** Centered gray text (from translations)
- **Sessions:** Flat list of cards, sorted by `session_date DESC` (newest first). Each card shows:
  - Title + `TrainingSessionStatusBadge` (planned/done/cancelled)
  - Date + time
  - Location (if set)
  - Description (if set)
  - Cancellation reason (if cancelled)
  - Action buttons: status change, edit, delete (status change + delete disabled for done/cancelled)

## Data Flow

```
page.tsx
├── useFetchTrainingSessions({ categoryId, seasonId })
│   └── GET /api/entities/training_sessions?categoryId=X&seasonId=Y
│   └── Returns: BaseTrainingSession[] sorted by session_date DESC
└── TrainingSessionList receives sessions as prop
    └── User clicks a session → onSelectedSession(sessionId)
    └── page.tsx sets selectedSession state
    └── AttendanceRecordingTable loads attendance for that session
```

## Data Model

```typescript
interface BaseTrainingSession {
  id: string;
  title: string;
  description: string | null;
  session_date: string;          // YYYY-MM-DD
  session_time: string | null;   // HH:mm
  location: string | null;
  status: TrainingSessionStatusEnum;  // 'planned' | 'done' | 'cancelled'
  status_reason: string | null;
  coach_id: string;
  category_id: string | null;
  season_id: string;
  created_at: string;
  updated_at: string;
}
```

---

## UX Problem

All sessions (past, present, future, all statuses) are rendered in a single flat list sorted by date descending. For a typical season with 120-160 sessions, this creates significant scrolling and cognitive load. There is no time-based segmentation, no "today" highlight, and no auto-selection of the nearest upcoming session.

## Proposed Improvement: Segmented Session Tabs

### Approach

Add inner tabs inside the card to segment sessions into three views. This uses HeroUI `Tabs` (already a project dependency) and requires no API changes — all filtering is client-side on already-fetched data.

### Tab Definitions

| Tab | Czech Label | Filter Logic | Sort | Default |
|---|---|---|---|---|
| **Nadcházející** | `"Nadcházející"` | `session_date >= today` AND `status = 'planned'` | ASC (nearest first) | Yes — default active tab |
| **Minulé** | `"Minulé"` | `session_date < today` OR `status IN ('done', 'cancelled')` | DESC (most recent first) | No |
| **Vše** | `"Vše"` | No filter | DESC (current behavior) | No |

### Wireframe

```
┌──────────────────────────────────────────────────┐
│  Tréninky                                        │
│  ┌─────────────┬──────────┬──────────┐           │
│  │Nadcházející │ Minulé   │   Vše    │           │
│  │    (3)      │   (24)   │   (29)   │           │
│  └─────────────┴──────────┴──────────┘           │
│                                                  │
│  ┌─ TODAY (border-l-4 border-primary) ───────┐   │
│  │ Trénink — 25. 2. 2026  16:00     [Dnes]  │   │
│  │ Hala Svinov  [Naplánován]  ✎ 🗑           │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │ Trénink — 27. 2. 2026  16:00             │   │
│  │ Hala Svinov  [Naplánován]  ✎ 🗑           │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │ Trénink — 1. 3. 2026  16:00              │   │
│  │ Hala Svinov  [Naplánován]  ✎ 🗑           │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### "Today" Highlight

Sessions where `session_date === today` receive:
- Left border accent: `border-l-4 border-primary`
- Small "Dnes" chip next to the date
- Visible in all tabs where the session appears

### Auto-Selection

When the page loads with the **Nadcházející** tab:
1. Find the first session where `session_date >= today` AND `status = 'planned'`
2. Auto-select it so `AttendanceRecordingTable` immediately shows data
3. Eliminates the current "blank right panel" on page load

### Edge Cases

| Scenario | Behavior |
|---|---|
| Cancelled future session | Appears in **Nadcházející** (status badge shows cancellation) |
| Today's session marked `done` | Moves to **Minulé** |
| Today's session still `planned` | Appears in **Nadcházející** with "Dnes" highlight |
| No upcoming sessions | **Nadcházející** shows empty state with CTA to create a session |
| Season with 0 sessions | All tabs show empty state |

### Implementation Steps

#### Step 1: Segmentation utility

Add a helper function (inside the component file or a local `utils.ts`) to split sessions:

```typescript
function segmentSessions(sessions: BaseTrainingSession[], today: string) {
  const upcoming = sessions
    .filter(s => s.session_date >= today && s.status === TrainingSessionStatusEnum.PLANNED)
    .sort((a, b) => a.session_date.localeCompare(b.session_date));

  const past = sessions
    .filter(s => s.session_date < today || s.status !== TrainingSessionStatusEnum.PLANNED)
    .sort((a, b) => b.session_date.localeCompare(a.session_date));

  return { upcoming, past, all: sessions };
}
```

Wrap with `useMemo` keyed on `[sessions, today]`.

#### Step 2: Refactor TrainingSessionList

- Add `Tabs` (HeroUI, `size="sm"`) below the card header
- Extract the session card rendering into a `TrainingSessionCard` subcomponent
- Add "today" highlight logic using date comparison
- Show counts in tab titles: `Nadcházející (${upcoming.length})`
- Add per-tab empty states using the `EmptyState` component pattern

#### Step 3: Auto-selection in page.tsx

Add a `useEffect` in `page.tsx`:

```typescript
useEffect(() => {
  if (sessions.length > 0 && !selectedSession) {
    const today = new Date().toISOString().split('T')[0];
    const nearest = sessions.find(
      s => s.session_date >= today && s.status === TrainingSessionStatusEnum.PLANNED
    );
    if (nearest) setSelectedSession(nearest.id);
  }
}, [sessions, selectedSession]);
```

#### Step 4: Translation keys

Add to `src/lib/translations/trainingSessions.ts`:

```typescript
tabs: {
  upcoming: 'Nadcházející',
  past: 'Minulé',
  all: 'Vše',
},
labels: {
  today: 'Dnes',
},
```

### Files to Change

| File | Change | Effort |
|---|---|---|
| `TrainingSessionList.tsx` | Add inner tabs, segmentation, today highlight, extract card subcomponent | Medium |
| `page.tsx` | Add auto-selection `useEffect` | Low |
| `src/lib/translations/trainingSessions.ts` | Add 4 translation keys | Trivial |

### Performance

- All filtering is client-side on already-fetched data — **no additional API calls**
- `useMemo` for segmented arrays prevents re-filtering on unrelated re-renders
- Typical season: 120-160 sessions — trivial to filter in-memory
- No pagination needed at this scale

### Optional Future Enhancements

1. **Text search** — `Input` field above the list filtering by title/date string
2. **Keyboard navigation** — arrow keys to move between sessions
3. **Session count in page header** — "Docházka (3 nadcházející)"
4. **Sticky tab bar** — keep tabs visible when scrolling long lists on mobile