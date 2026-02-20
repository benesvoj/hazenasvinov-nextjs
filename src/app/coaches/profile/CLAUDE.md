# Coaches Profile Page

## Purpose

This page allows coaches to manage their **personal coach card** — the public-facing profile that can optionally be displayed on the club's public category pages.

Coaches have full control over what is visible publicly. The coach card is **not a list** — each coach has exactly one card (1:1 with their user account).

## Behaviour

- **No card exists yet**: The form renders empty. The coach fills it in and clicks "Create" to persist a new card.
- **Card already exists**: On load the form is pre-populated with the coach's existing data. Saving calls the update (PATCH) flow.
- **Public visibility**: The coach selects which of their assigned categories they want to appear in. They can be published to multiple categories, a single one, or none (private/hidden).

## Data Flow

1. On mount, `useFetchCoachCard` fetches **only the authenticated user's own card** — there is no list, no pagination, no admin view here.
2. The GET endpoint (`/api/coach-cards`) uses the authenticated session to determine whose card to load — the `userId` query param is for cache-keying only.
3. If the API returns `null`, the card does not exist yet → form is blank, submit calls `POST /api/coach-cards`.
4. If the API returns a card object, the form is pre-filled → submit calls `PATCH /api/coach-cards/:id`.

## Known Issues / Architecture Notes

- `createDataFetchHook` is a list-oriented factory (`data: T[]`). The GET endpoint currently returns a **single object**, not an array. `useFetchCoachCard` works around this with a `useMemo` that calls `.length` on the raw response — this breaks when the response is a plain object. **The correct fix is either to have the GET return a single-element array, or to use a dedicated singleton fetch hook instead of the list factory.**
- Because of the above, `existingCard` is always `null` on the client regardless of server state, which causes every save to go through `POST` → the server correctly rejects duplicate creates with HTTP 409.
- The `hasCoachRole` check in `POST /api/coach-cards` is missing `await` — the guard is currently ineffective.

## Files

- `page.tsx` — Route entry point, renders `CoachCardEditor` inside `PageContainer`
- `components/CoachCardEditor.tsx` — Full form: photo upload, name/contact fields, category visibility checkboxes
- `src/hooks/entities/coach-card/data/useFetchCoachCard.ts` — Fetches the coach's own card; wraps the list factory to extract a single item
- `src/hooks/entities/coach-card/state/useCoachCard.ts` — CREATE / UPDATE / DELETE mutations via `createCRUDHook` factory
- `src/hooks/entities/coach-card/state/useCoachCardPhoto.ts` — Photo upload/delete to Supabase Storage
- `src/app/api/coach-cards/route.ts` — `GET` (fetch own card) + `POST` (create)
- `src/app/api/coach-cards/[id]/route.ts` — `PATCH` (update) + `DELETE`