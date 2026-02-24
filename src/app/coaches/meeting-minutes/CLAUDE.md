# Meeting Minutes Section

## Purpose

Manages meeting minutes records with attendee tracking. Coaches can create, edit, and delete meeting minutes, and manage who attended each meeting. Filtered by season and author.

## Files

| File | Responsibility |
|---|---|
| `page.tsx` | Route entry point — renders `MeetingMinutesContainer` inside `PageContainer` |

Note: The actual implementation lives in `src/components/features/meeting-minutes/MeetingMinutesContainer.tsx` — this is a shared component, not coach-specific.

## Data Flow

```
page.tsx
└── MeetingMinutesContainer
    ├── useMeetingMinutes() → CRUD operations
    ├── fetchUsers() → GET /api/users (all users for "wrote by" dropdown)
    ├── Filters: search, season_id, wrote_by
    │
    ├── Meeting minutes cards
    │   ├── Edit modal
    │   ├── Delete confirmation
    │   └── Attendees modal
    │
    └── Pagination
```

## Category Filtering

**Not implemented.** Meeting minutes are not filtered by category at all. All coaches see all meeting minutes regardless of their assigned categories.

This may be intentional (meeting minutes are cross-category), but should be explicitly documented as a design decision.

## Issues & Technical Debt

### High

1. **No category isolation** — If meeting minutes should be category-scoped, this is a significant gap. If they are intentionally shared, this should be documented.

2. **Unclear authorization model** — No visible RLS or role checks in the component. It's unclear if coaches should be able to edit/delete minutes created by other coaches.

### Medium

3. **Global user list fetch** — `fetchUsers()` retrieves all users in the system. For larger organizations, this could be a performance issue. Consider filtering to coaches only.

4. **Shared component** — `MeetingMinutesContainer` is not coach-specific. If the admin portal also uses it, category filtering and permissions may need to differ by context.

### Low

5. **Minimal page.tsx** — The page file is just a wrapper. All logic is in the shared container component.

## Improvement Proposals

1. **Decide on category scoping** — Determine whether meeting minutes should be:
   - **Cross-category** (current behavior): Document this as intentional. All coaches see all minutes.
   - **Category-scoped**: Add a `category_id` column to meeting minutes and filter by coach's assigned categories.

2. **Add authorization checks** — Define who can edit/delete meeting minutes (only the author? any coach? only admins?). Implement both client-side UI restrictions and server-side validation.

3. **Optimize user list** — Filter the user dropdown to relevant users (coaches, admins) rather than fetching all users.

4. **Consider passing a `variant` prop** to `MeetingMinutesContainer` to differentiate coach vs. admin behavior if the component is shared.