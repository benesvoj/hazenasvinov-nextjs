# TrainingSessionList Component

## Purpose

Displays a segmented, selectable list of training sessions within the Attendance page. Coaches use this list to pick a session, then record per-member attendance in the adjacent `AttendanceRecordingTable`. Provides quick actions: change status, edit, and delete.

## Files

| File | Lines | Status |
|---|---|---|
| `TrainingSessionList.tsx` | ~107 | Clean — dynamic tabs with segmentation |
| `components/TrainingSessionCard.tsx` | ~121 | Clean — extracted card with "Dnes" highlight |
| `components/TrainingSessionStatusBadge.tsx` | ~40 | Clean — status chip (planned/done/cancelled) |
| `utils/segmentSessions.ts` | ~30 | Clean — segmentation logic + `SessionSegment` type |

## Architecture

```
TrainingSessionList.tsx
├── segmentSessions(sessions, today) → { upcoming, past, all }
├── tabs[] (memoized SessionTab array for dynamic HeroUI Tabs)
├── UnifiedCard (wrapper with title + loading state)
│   └── Tabs (HeroUI, dynamic items pattern, size="sm")
│       ├── Tab "Nadcházející (N)" → upcoming sessions (ASC by date)
│       ├── Tab "Minulé (N)" → past sessions (DESC by date)
│       └── Tab "Vše (N)" → all sessions (original order)
│           └── TrainingSessionCard (per session)
│               ├── Title + "Dnes" Chip (if isToday) + StatusBadge
│               ├── Date + time, location, description
│               ├── Cancellation reason (if cancelled)
│               └── Action buttons: status change, edit, delete
```

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

## Segmentation Logic

**File:** `utils/segmentSessions.ts`

```typescript
type SessionSegment = 'upcoming' | 'past' | 'all';

function segmentSessions(sessions, today): SegmentedSessions {
  upcoming: session_date >= today AND status === 'planned' → sorted ASC (nearest first)
  past:     session_date < today OR status !== 'planned'   → sorted DESC (most recent first)
  all:      unfiltered (original order from API)
}
```

Both `segments` and the `tabs` array are wrapped in `useMemo`. The `today` string is also memoized with `useMemo(() => ..., [])`.

## Dynamic Tabs Pattern

Uses HeroUI's `items` prop for dynamic tab rendering:

```typescript
interface SessionTab {
  id: SessionSegment;
  label: string;          // e.g. "Nadcházející (3)"
  sessions: BaseTrainingSession[];
}

<Tabs items={tabs} selectedKey={activeSegment} ...>
  {(tab) => (
    <Tab key={tab.id} title={tab.label}>
      {isEmpty(tab.sessions)
        ? <empty state message>
        : tab.sessions.map(session => <TrainingSessionCard ... />)
      }
    </Tab>
  )}
</Tabs>
```

## "Today" Highlight

`TrainingSessionCard` receives `isToday` prop (computed as `session.session_date === today`). When true, renders a `<Chip color="primary" size="sm">Dnes</Chip>` next to the session title.

## Data Flow

```
page.tsx
├── useFetchTrainingSessions({ categoryId, seasonId })
│   └── GET /api/entities/training_sessions?categoryId=X&seasonId=Y
│   └── Returns: BaseTrainingSession[] sorted by session_date DESC
└── TrainingSessionList receives sessions as prop
    ├── segmentSessions() splits into upcoming/past/all
    ├── Dynamic tabs render each segment
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

## Translation Keys Used

From `translations.trainingSessions`:
- `title` — card header
- `tabs.upcoming` / `tabs.past` / `tabs.all` — tab labels
- `labels.today` — "Dnes" chip
- `noTrainingSessionsFound` — per-tab empty state
- `trainingSessionDescription` — description label
- `cancelTrainingSessionReason` — cancellation reason label
- `changeTrainingSessionStatus` / `updateTrainingSession` / `deleteTrainingSession` — aria-labels

## Edge Cases

| Scenario | Behavior |
|---|---|
| Cancelled future session | Appears in **Nadcházející** (status badge shows cancellation) |
| Today's session marked `done` | Moves to **Minulé** |
| Today's session still `planned` | Appears in **Nadcházející** with "Dnes" chip |
| Empty segment | Shows "Nenalezen žádný trénink odpovídající zadaným kritériím." |

## Remaining Items

| Priority | Item | File |
|---|---|---|
| Optional | Auto-select nearest upcoming session on page load | `page.tsx` — add `useEffect` |
| Optional | Show global empty state (with CTA) when `sessions.length === 0` instead of empty tabs | `TrainingSessionList.tsx` |
| Optional | Text search / date filter for large session lists | Future enhancement |