# UnifiedCard Refactor — COMPLETED

## Final Architecture

**Files:**
- `src/components/ui/cards/UnifiedCard.tsx` — high-level card component, composes primitives from `components/`
- `src/components/ui/cards/components/` — extracted primitives (`CardBody`, `CardHeader`, `CardFooter`)
- `src/components/ui/cards/Card.tsx` — low-level HeroUI wrapper, escape hatch for custom cards
- `src/types/components/unifiedCard.ts` — props interface

**Structure:**
```
cards/
  UnifiedCard.tsx          ← high-level: title, actions (ReactNode), loading, empty state, footer
  Card.tsx                 ← low-level: thin HeroUI wrapper for custom cards
  components/
    CardBody.tsx           ← extracted primitive
    CardHeader.tsx         ← extracted primitive
    CardFooter.tsx         ← extracted primitive
    index.ts               ← barrel
```

### Design decision: UnifiedCard vs Card + ActionCard

**UnifiedCard stays as the primary card component.** Rationale:

- `Card` (from Card.tsx) is too low-level — just `isPressable`, `radius`, `shadow`, `className`. Using it directly requires manually composing header/body/footer every time, losing consistency.
- `ActionCard` was a subset of what UnifiedCard already does (title + actions + content + footer). Redundant — removed.
- `Card` remains as a **low-level escape hatch** for cases where UnifiedCard's structure doesn't fit (e.g. TodoStatsCard with fully custom content/styling).

---

## All Completed Work

| Item | Status |
|---|---|
| Extract `CardBody`, `CardHeader`, `CardFooter` into `components/` | DONE |
| Single `<HeroCard>` shell — loading handled inside with `Show`/`Hide` (no layout shift) | DONE |
| Make `children` optional in types | DONE |
| Remove manual `cursor-pointer` class | DONE |
| Remove bloated JSDoc | DONE |
| Use `Show`/`Hide` instead of ternary branching | DONE |
| Fix hover — removed from `baseClass`, `hoverClass` applied correctly | DONE |
| Fix className logic — `baseClass` always applied, `hoverClass` gated on `isInteractive` | DONE |
| Add `className` passthrough prop | DONE |
| Remove `icon` prop from UnifiedCard | DONE |
| Remove unused prop values (`padding: 'md' \| 'lg'`, `variant`, `contentAlignment`) | DONE |
| `isPressable`/`onPress` redundancy resolved | DONE |
| Remove duplicated primitives from Card.tsx (`CardBody`, `CardHeader`, `CardFooter`, `CardList`, `ActionCard`) | DONE |
| Clean up `emptyStateType` type (removed redundant `\| undefined`) | DONE |
| Add `Grid`/`GridItem` layout components to replace `CardGrid` | DONE |
| Document layout components in `CLAUDE.md` | DONE |
| Fix Card.tsx hover bug (gated on `isPressable`) | DONE |
| Adopt `Grid`/`GridItem` across codebase (dashboard, attendance, lineups, TeamSelector) | DONE |
| Adopt `VStack` across codebase (ToDoList, CommentsZone, TrainingSessionList, BirthdayCard) | DONE |
| Remove `col-span-*` layout concerns from child components (AttendanceRecordingTable, LineupMembers, LineupsList) | DONE |
| Simplify `actions` prop from `ActionsProps[]` to `React.ReactNode` | DONE |
| Migrate callers to pass JSX actions (TodoListItem, CommentsZoneItem, CommentsZone, ToDoList) | DONE |
| Delete `CardActions.tsx` (dead code) | DONE |
| Remove unused `ActionsProps` import from types | DONE |

---

## Usage Patterns

| Pattern | Example Files | Key Props | Count |
|---|---|---|---|
| **Clickable + selectable** | TeamSelector | `onPress`, `isPressable`, `isSelected` | 1 |
| **List item with actions** | TodoListItem, CommentsZoneItem | `title`, `actions` (ReactNode), `subtitle`, `footer` | 3 |
| **Data card with loading** | BirthdayCard, ToDoList, TrainingSessionList | `title`, `isLoading`, `emptyStateType` | 4 |
| **Static container** | VenueCard, BillingInfoCard, ClubConfigCard | `title`, `footer` | 5 |
| **Form section** | BasicInfoSection, ContactSection, etc. | `title`, `padding='none'`, `titleClassName` | 5 |
| **Table wrapper** | members/page, matches/page, lineups/page | `padding='none'` | 6 |
| **Custom card (low-level)** | TodoStatsCard | Uses `Card` directly with `className` | 1 |

---

## No remaining phases

All planned refactoring is complete. The UnifiedCard refactor is finished.