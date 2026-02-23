Perform a thorough code review of the current branch's changes, tailored to this project's architecture and conventions.

## Step 1 — Gather diff

Run:
```bash
git diff main...HEAD
git log main...HEAD --oneline
```

Read all changed files to understand the full scope of the PR.

---

## Step 2 — Review checklist

Work through each section below. For every issue found, note the **file path + line number** and a brief explanation.

### Architecture & patterns

- [ ] **Entity scaffolding completeness**: If a new entity was added, verify all required files exist:
  - `src/types/entities/{entity}/schema/{entity}Schema.ts`
  - `src/types/entities/{entity}/data/{entity}.ts`
  - `src/queries/{entities}/constants.ts`, `queries.ts`, `mutations.ts`, `index.ts`
  - `src/hooks/entities/{entity}/data/useFetch*.ts`
  - `src/hooks/entities/{entity}/state/use*.ts`
  - Translation file in `src/lib/translations/`
  - Barrel exports updated in `src/types/index.ts`, `src/hooks/index.ts`

- [ ] **Queries follow factory pattern**: Data fetch hooks use `createDataFetchHook`, CRUD hooks use `createCRUDHook`. Direct `fetch()` calls in hooks are a red flag.

- [ ] **QueryContext usage**: Query functions in `src/queries/` receive `ctx: QueryContext` as the first argument and use `ctx.supabase` — never import or call the Supabase client directly inside query files.

- [ ] **Supabase client selection**: Verify the right client is used per context:
  - `createClient()` from `@/utils/supabase/client` → browser (client components)
  - `createServerClient()` from `@/utils/supabase/server` → server components / route handlers
  - `createCoachAuthClient()` from `@/utils/supabase/coachAuth` → coach-specific routes
  - Never mix server and client clients in the same file.

### TypeScript

- [ ] **No `any` types** unless explicitly justified with a comment.
- [ ] **Schema types used correctly**: `Insert` type used for create operations, `Update` type for updates, base schema for reads.
- [ ] **Form data types defined** in `src/types/entities/{entity}/data/{entity}Forms.ts` — not inlined in components.
- [ ] **Strict null checks respected**: No `!` non-null assertions without a guard above.

### Database & migrations

- [ ] **New tables have a migration file** in `scripts/migrations/` with the correct timestamp naming: `{YYYYMMDD}_{description}.sql`.
- [ ] **RLS policies defined** for every new table (not just the table creation).
- [ ] **`updated_at` trigger** present for tables with an `updated_at` column.
- [ ] **No raw SQL** embedded as strings in TypeScript files — use Supabase query builder or dedicated query functions.

### API routes

- [ ] **Auth check at the top** of every protected route handler — check for session before any DB operation.
- [ ] **API route registered** in `src/lib/api-routes.ts` for any new `src/app/api/` route.
- [ ] **Error responses** use consistent shape: `{ error: string }` with appropriate HTTP status codes.
- [ ] **No sensitive data** returned in public (unauthenticated) endpoints.

### Translations

- [ ] **Czech strings** used for all user-facing text (this is a Czech-language app).
- [ ] **Translation file updated** in `src/lib/translations/` for any new UI strings.
- [ ] **Translations object updated** in `src/lib/translations/index.ts` to include new translation file.
- [ ] No hardcoded Czech or English strings in component JSX — use `translations.*`.

### React & components

- [ ] **`'use client'`** directive present on all files using hooks, event handlers, or browser APIs.
- [ ] **No server-only imports** (e.g. `@/utils/supabase/server`) inside client components.
- [ ] **TanStack Query used** for server state in admin/data-heavy pages — not raw `useState` + `useEffect` fetching.
- [ ] **Loading and error states handled** in all data-fetching components.

### Code quality

- [ ] **No dead code** — unused imports, commented-out blocks, or `console.log` left in.
- [ ] **Barrel exports updated** after adding new files — check `src/hooks/index.ts`, `src/types/index.ts`, `src/components/index.ts`.
- [ ] **Import ordering** follows project convention (enforced by ESLint): external → internal `@/` → relative.
- [ ] **Pre-commit hooks would pass**: mentally verify lint and tsc would succeed.

---

## Step 3 — Summary

Produce a structured review output:

```
## PR Review Summary

### Blocking issues (must fix before merge)
- file:line — description

### Suggestions (non-blocking)
- file:line — description

### Positive notes
- What was done well

### Checklist result
- X/Y checks passed
```

If there are no issues, say so clearly and give a brief summary of what the PR does.