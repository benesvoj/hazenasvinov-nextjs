# Admin — Club Config Page

## Purpose

This page lets administrators manage two things, separated by tabs:

1. **Club Config** (`ClubConfigCard`) — core identity and content of the club: name, logo, hero section, contact details, social links, founding year, description.
2. **Club Pages** (`ClubPagesCard`) — which public pages and landing-page sections are visible.

Only one club config record ever exists (`is_active = true`). There is no create/delete flow here — only read and update.

## Behaviour

- On load, the active club config is fetched via `GET /api/club-config` (public endpoint — no auth required).
- The form renders in **read (view) mode** by default. Clicking "Upravit konfiguraci" switches to **edit mode**.
- In edit mode all fields become inputs. Clicking "Uložit změny" calls `PUT /api/club-config/:id` (admin-only). Clicking "Zrušit" resets the form to the last fetched values.
- Logo and hero image are uploaded to Supabase Storage via `uploadClubAsset`. The old file is deleted after a successful upload.

## Data Flow

1. `useFetchClubConfig()` fetches `GET /api/club-config` on mount, stores result as `ClubConfig | null`.
2. `useClubConfig()` exposes `updateClubConfig(id, data)` which calls `PUT /api/club-config/:id`.
3. File uploads use `uploadClubAsset` / `deleteClubAsset` from `@/utils/supabase/storage` directly in the component.

## API Routes

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/club-config` | Public | Fetch active config |
| PUT | `/api/club-config/[id]` | Admin only | Update config fields |

## Files

- `page.tsx` — Tab container (Club Config / Club Pages tabs)
- `components/ClubConfigCard.tsx` — Edit/view form for club identity, hero, contact, social
- `components/ClubPagesCard.tsx` — Page visibility and section toggles
- `src/hooks/entities/club-config/data/useFetchClubConfig.ts` — Singleton data fetch hook
- `src/hooks/entities/club-config/state/useClubConfig.ts` — Update mutation hook
- `src/app/api/club-config/route.ts` — GET (public)
- `src/app/api/club-config/[id]/route.ts` — PUT (admin)
- `src/lib/translations/clubConfig.ts` — UI strings (currently incomplete)

## Known Issues / Gaps

See `PROPOSAL.md` in this directory for a full list of issues and the recommended refactor plan.