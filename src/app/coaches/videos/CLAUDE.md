# Videos Section

## Purpose

Video library for coaches to manage training and match videos. Supports full CRUD operations with filtering by category, club, season, and search. Coaches can only add videos to their assigned categories.

## Files

| File | Responsibility |
|---|---|
| `page.tsx` | Full page — video CRUD, filtering, pagination, category access control |

## Data Flow

```
page.tsx
├── useAuth() → current user
├── useUserRoles().getCurrentUserCategories() → assigned categories
├── useFetchVideos() → ALL videos (global fetch)
├── useVideoFiltering() → client-side filter (search, category, club, season, active)
│
├── availableCategories = filter(allCategories, assignedCategories)
│
├── VideoPageLayout
│   ├── Filter bar (category dropdown limited to available)
│   ├── Video cards (paginated, 20/page)
│   ├── Create modal (category dropdown limited to available)
│   ├── Edit modal
│   └── Delete modal
│
└── Warning UI if no assigned categories
```

## Category Filtering

- Fetches ALL videos globally via `useFetchVideos()` — no server-side category restriction
- Client-side filtering via `useVideoFiltering()` hook when coach selects a category filter
- UI limits category dropdown to assigned categories only
- "Add Video" button disabled if no assigned categories
- Warning message shown when `assignedCategories.length === 0`

## Issues & Technical Debt

### Critical

1. **No server-side category filtering** — `useFetchVideos()` returns ALL videos in the system. Client-side filtering restricts what's displayed, but all data is loaded into the browser. A coach could inspect network responses to see videos from unauthorized categories.

2. **Security: category bypass possible** — While the UI limits the category filter dropdown, the underlying data contains videos from all categories. A coach could also create videos for unauthorized categories by bypassing client-side validation.

### High

3. **Performance** — Loading all videos into memory is inefficient for large datasets. Should implement server-side filtering with pagination.

4. **Missing data refresh after mutations** — After create/update/delete, `fetchVideos` may not be called, causing stale data until page refresh.

### Medium

5. **`getCurrentUserCategories()` checks localStorage** for admin simulation — this is shared infrastructure, not specific to videos, but worth noting as a dependency.

### Low

6. **Single-file page** — All logic in one file. As the feature grows, should extract into hooks and sub-components.

## Improvement Proposals

1. **Add server-side category filtering** — Modify `useFetchVideos()` to accept `categoryIds` parameter and filter on the API side. Only return videos for the coach's assigned categories.

2. **Add server-side category validation for mutations** — The create/update API should verify that the `category_id` in the request body is one of the coach's assigned categories.

3. **Implement server-side pagination** — Replace the global fetch + client-side pagination with proper server-side pagination and filtering.

4. **Invalidate queries after mutations** — Ensure TanStack Query cache is properly invalidated after create/update/delete operations.

5. **Add RLS policies** to the videos table restricting read/write access to coaches' assigned categories.