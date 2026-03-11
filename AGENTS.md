<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

# Project Overview

Club management system for TJ Sokol Svinov (Czech handball club).

**Stack:** Next.js 16 App Router · TypeScript strict · Supabase (PostgreSQL + Auth) · TanStack Query v5 · HeroUI v2 · Tailwind CSS v4 · Vitest

**UI language is Czech** — all user-facing strings, labels, toasts, and validation messages must be in Czech.

---

# Skills — Use Proactively

Skills live in `.claude/skills/`. Invoke them **without being asked** when the situation matches:

| Skill | When to trigger |
|---|---|
| `/new-entity` | User asks to add a new database table, data model, or CRUD feature |
| `/db-sync` | After any DB migration is applied or when TS types are out of sync with the database |
| `/new-migration` | A new table, column, function, view, or RLS policy needs to be created |
| `/generate-barrels` | After adding, renaming, or removing any hook, component, type, or enum file — run before committing |
| `/review-pr` | User asks for a code review, PR review, or "check my changes" |

### `/generate-barrels` execution order

```bash
npm run generate:enums
npm run generate:types
npm run generate:hooks
npm run generate:components
npm run generate:api-routes
npm run tsc
npm run fix:imports    # if needed
```

### `/db-sync` execution order

```bash
npm run db:generate-types
npm run db:generate-schemas
# then run /generate-barrels
npm run tsc
```

---

# App Router Structure

## Route Groups

| Group | Path prefix | Purpose |
|---|---|---|
| `(main)` | `/` | Public-facing website |
| `(betting)` | `/betting` | Betting feature |
| `admin/` | `/admin/*` | Admin portal (authenticated) |
| `coaches/` | `/coaches/*` | Coach portal (authenticated) |

## Public Pages (`(main)`)

`/` · `/blog` · `/blog/[slug]` · `/matches` · `/matches/[id]` · `/photo-gallery` · `/chronicle` · `/downloads` · `/contact` · `/about` · `/100` · `/celebration` · `/categories/[slug]`

## Admin Pages (`admin/`)

`categories` · `club-categories` · `club-config` · `clubs` · `clubs/new` · `clubs/[id]` · `committees` · `grant-calendar` · `matches` · `meeting-minutes` · `member-functions` · `members` · `photo-gallery` · `posts` · `seasons` · `sponsorship` · `user-roles` · `users` · `videos` · `betting/generate-odds`

## Coach Pages (`coaches/`)

`dashboard` · `attendance` · `lineups` · `matches` · `meeting-minutes` · `members` · `profile` · `statistics` · `videos` · `login`

## Auth Routes

`/login` · `/auth/callback` · `/reset-password` · `/set-password` · `/blocked`

---

# Route Constants

## `APP_ROUTES` — `src/lib/app-routes.ts` (manual file)

Front-end navigation routes. Organized into `public`, `auth`, `admin`, `coaches` sections.

```ts
APP_ROUTES.public.home        // '/'
APP_ROUTES.public.blogPost(slug) // '/blog/{slug}'
APP_ROUTES.admin.members      // '/admin/members'
APP_ROUTES.coaches.dashboard  // '/coaches/dashboard'
```

## `API_ROUTES` — `src/lib/api-routes.ts` (auto-generated)

Backend API routes. **Do not edit manually** — regenerate with `npm run generate:api-routes`.

```ts
API_ROUTES.members.root           // '/api/members'
API_ROUTES.members.byId('123')    // '/api/members/123'
API_ROUTES.entities.root('todos') // '/api/entities/todos'
API_ROUTES.entities.byId('todos', '1') // '/api/entities/todos/1'
```

---

# API Routes

## Generic Entity Gateway (primary pattern)

`GET/POST /api/entities/[entity]` and `GET/PATCH/DELETE /api/entities/[entity]/[id]`

Driven by `ENTITY_CONFIGS` in `src/app/api/entities/config.ts`. Registered entities:
`committees` · `seasons` · `categories` · `clubs` · `club_categories` · `club_config` · `grants` · `blog_posts` · `comments` · `todos` · `videos` · `training_sessions` · `member_attendance` · `category_lineups` · `category_lineup_members` · `role_definitions` · `users`

## Dedicated Routes (complex logic)

These have custom route handlers outside the generic gateway:
- `/api/members` · `/api/members/[id]` · `/api/members/[id]/relationships` · `/api/members/external` · `/api/members/internal` · `/api/members/on-loan`
- `/api/matches/[id]/lineups` · `.../players` · `.../coaches`
- `/api/categories/[id]/fees` · `.../lineups` · `.../lineups/[lineupId]/members`
- `/api/coach-cards` · `/api/coach-cards/[id]` · `/api/coach-cards/public`
- `/api/blog/by-slug/[slug]` · `/api/blog-posts-published`
- `/api/clubs` · `/api/clubs/[id]` · `/api/clubs/relationships`
- `/api/sponsorship/main-partners` · `/api/sponsorship/business-partners` · `/api/sponsorship/media-partners`
- `/api/member-functions` · `/api/member-payments` · `/api/member-payment-status`
- `/api/auth/confirm` · `/api/auth/reset-password` · `/api/auth/simple-reset-password`
- `/api/admin/update-materialized-view` · `/api/attendance/statistics`
- `/api/page-visibility` · `/api/check-user` · `/api/log-login` · `/api/status`
- `/api/training-sessions/bulk` · `/api/todos` · `/api/user-profiles` · `/api/users`

---

# Architecture Conventions

## Three-Layer Data Pattern

```
queries/           → DB access (server-only, receives QueryContext)
hooks/entities/    → Client-side data + state management
components/        → UI consumption
```

## Entity File Layout

Every entity follows this structure:

```
src/types/entities/{camelCase}/
  schema/{camelCase}Schema.ts    ← AUTO-GENERATED (do not edit)
  data/{camelCase}.ts            ← domain types extending schema

src/queries/{pluralCamel}/
  constants.ts                   ← DB_TABLE + ENTITY
  queries.ts                     ← read functions (QueryContext)
  mutations.ts                   ← write functions (QueryContext)
  index.ts                       ← barrel

src/hooks/entities/{kebab-case}/
  data/useFetch{Entity}s.ts      ← createDataFetchHook factory
  state/use{Entity}.ts           ← createCRUDHook factory

src/lib/translations/{pluralCamel}.ts  ← Czech strings
```

### All query module names

`blogPosts` · `categories` · `categoryLineupMembers` · `categoryLineups` · `clubCategories` · `clubConfig` · `clubs` · `coachCards` · `comments` · `committees` · `grants` · `matches` · `memberAttendance` · `members` · `membersExternal` · `membersInternal` · `membersOnLoan` · `roleDefinitions` · `seasons` · `todos` · `trainingSessions` · `userProfiles` · `users` · `videos`

## Query Pattern

All query/mutation functions in `src/queries/` receive `ctx: QueryContext` as first argument and use `ctx.supabase`. **Never** call the Supabase client directly inside query files.

Server-side mutations use the `createMutationHelpers` factory from `src/queries/shared/createMutationHelpers.ts`.

## Hook Factories (`src/hooks/factories/`)

| Factory | Purpose | Returns |
|---|---|---|
| `createDataFetchHook<T>` | Read-only data fetching | `{ data, loading, error, refetch }` |
| `createCRUDHook<T, TInsert>` | Create/Update/Delete operations | `{ create, update, deleteItem, loading }` |
| `createFormHook<TEntity, TFormData>` | Form state with validation | `{ formData, validateForm, openAddMode, openEditMode, ... }` |

### Hook directory convention

- `data/` — read-only fetchers (via `createDataFetchHook`)
- `state/` — mutations (via `createCRUDHook`)
- `business/` — derived/computed logic (filtering, metadata)

---

# Supabase Client Rules

| Context | What to use |
|---|---|
| Client component / browser | `supabaseBrowserClient()` from `@/utils/supabase/client` |
| Server component | `supabaseServerClient()` from `@/utils/supabase/server` |
| API route (authenticated) | `withAuth(handler)` from `@/utils/supabase/apiHelpers` |
| API route (admin only) | `withAdminAuth(handler)` from `@/utils/supabase/apiHelpers` |
| API route (public) | `withPublicAccess(handler)` from `@/utils/supabase/apiHelpers` |
| Coach role checks in API routes | `hasCoachRole()` / `isAdmin()` / `checkCoachCardAccess()` from `@/utils/supabase/coachAuth` |

**Rules:**
- Never import a server client in a client component or vice versa
- Prefer `apiHelpers` wrappers over calling `supabaseServerClient()` directly in API routes
- `apiHelpers` provides: `withAuth`, `withAdminAuth`, `withPublicAccess`, `withOptionalAuth`, `validateBody`, `errorResponse`, `successResponse`, `prepareUpdateData`

---

# Component Structure

```
src/components/
  boundaries/          — Error boundaries
  features/
    admin/             — Admin-specific features (grants, etc.)
    betting/           — Betting feature UI
    blog/              — Blog post components
    coaches/           — Coach portal features
    loaning/           — Player loan management
    meeting-minutes/   — Meeting minutes
    release-notes/     — Release notes display
    videos/            — Video management
  providers/           — React context providers
  routes/              — Route guard / access control
  shared/
    contacts-section/  — Contact info
    match/             — Shared match display
    members/           — Shared member UI, modals, config
    player-manager/    — Player pool management
    profile-card/      — Coach profile card
    standing-table/    — Standings table
  ui/
    cards/             — Card primitives
    chips/             — Chip/badge components
    client/            — Client-side UI (UnifiedTopBar, inputs, tables, etc.)
    containers/        — Layout containers
    feedback/          — Toast, loading, error states
    forms/             — Form primitives
    modals/            — Modal primitives (UnifiedModal)
    navigation/        — Nav primitives
    text/              — Typography components
```

---

# Barrel Exports

**Auto-generated (never edit manually — use `/generate-barrels`):**
- `src/hooks/index.ts`
- `src/types/index.ts`
- `src/components/index.ts`
- `src/lib/api-routes.ts`

**Manual (update by hand):**
- `src/lib/translations/index.ts`
- `src/lib/app-routes.ts`

### Excluding from barrel generation

- **File-level:** add `// @barrel-ignore` on any of the first 5 lines
- **Folder-level:** drop an empty `.barrel-ignore` file inside the directory

---

# Translations

All UI strings live in `src/lib/translations/`. Each entity/feature has its own file exporting a typed object with Czech strings organized by sub-keys (`responseMessages`, `enums`, labels, etc.).

The index barrel at `src/lib/translations/index.ts` (manual file) exports a single `translations` object with namespaced keys:
`admin` · `auth` · `common` · `matches` · `seasons` · `attendance` · `coachCards` · `coachPortal` · `clubs` · `committees` · `components` · `clubConfig` · `categories` · `trainingSessions` · `members` · `meetingMinutes` · `topBar` · `public` · `lineups` · `todos` · `matchRecordings` · `betting` · `blogPosts` · `comments` · `membershipFees` · `teams` · `clubCategories` · `grantCalendar` · `lineupManager` · `memberFunctions` · `sponsorship` · `lineupMembers` · `memberClubRelationship` · `users` · `photoGallery` · `userRoles`

When adding a new entity/feature, create a new translation file and add it to the index manually.

---

# Database Migrations

Migration files: `scripts/migrations/{YYYYMMDD}_{snake_case_description}.sql`

Rules:
- Always include the standard header (see `/new-migration` skill)
- RLS policies are required for every new table
- Include `updated_at` trigger for tables with that column
- After applying, run `/db-sync` to regenerate types

---

# Key Utility Files

| Path | Purpose |
|---|---|
| `src/utils/supabase/apiHelpers.ts` | API route auth wrappers + response helpers |
| `src/utils/supabase/coachAuth.ts` | Coach/admin role checking helpers |
| `src/utils/supabase/admin.ts` | Service role client (bypasses RLS) |
| `src/utils/supabase/middleware.ts` | `updateSession()` for Next.js middleware |
| `src/lib/queryKeys.ts` | Centralized TanStack Query key factories |
| `src/lib/queryClient.ts` | TanStack Query client setup |
| `src/app/api/entities/config.ts` | `ENTITY_CONFIGS` registry for generic gateway |
| `src/queries/shared/createMutationHelpers.ts` | Server-side mutation factory |
| `src/queries/shared/types.ts` | `QueryContext`, `QueryResult` types |

---

# Quality Gates

| Hook | What runs |
|---|---|
| Pre-commit | ESLint + Prettier + `tsc` |
| Pre-push | Full test suite (`npm run test:run`) |

Before suggesting a commit, verify:
```bash
npm run tsc
npm run lint
```

---

# Key npm Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run tsc` | Type-check (no emit) |
| `npm run lint` | ESLint |
| `npm run test:run` | Run tests (Vitest) |
| `npm run db:generate-types` | Regenerate Supabase types |
| `npm run db:generate-schemas` | Split types into per-entity schema files |
| `npm run generate:enums` | Regenerate enum barrels |
| `npm run generate:types` | Regenerate type barrels |
| `npm run generate:hooks` | Regenerate hook barrels |
| `npm run generate:components` | Regenerate component barrels |
| `npm run generate:api-routes` | Regenerate API route constants |
| `npm run fix:imports` | Auto-fix import ordering |