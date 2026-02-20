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

This is a Next.js club management system for TJ Sokol Svinov (Czech handball club).
Stack: Next.js 16 App Router · TypeScript strict · Supabase (PostgreSQL + Auth) · TanStack Query v5 · HeroUI v2 · Tailwind CSS v4 · Vitest.

UI language is **Czech** — all user-facing strings must be in Czech.

# Skills — When to Use Them Proactively

The following slash command skills are available in `.claude/skills/`. Use them **without being asked** when the situation matches:

- `/new-entity` — use proactively whenever the user asks to add a new database table, data model, or CRUD feature. Do not scaffold files manually; invoke this skill.
- `/db-sync` — use proactively after any DB migration is applied or when TypeScript types are out of sync with the database schema.
- `/new-migration` — use proactively whenever a new table, column, function, view, or RLS policy needs to be created in the database.
- `/generate-barrels` — use proactively after adding, renaming, or removing any hook, component, type, or enum file. Run before committing.
- `/review-pr` — use when the user asks for a code review, PR review, or "check my changes".

# Architecture Conventions

Follow these patterns strictly. Do not deviate without explicit user instruction.

## Entity structure

Every entity follows this file layout:
```
src/types/entities/{camelCase}/
  schema/{camelCase}Schema.ts   ← AUTO-GENERATED, do not edit manually
  data/{camelCase}.ts           ← domain types extending schema

src/queries/{pluralCamel}/
  constants.ts                  ← DB_TABLE + ENTITY
  queries.ts                    ← read functions (QueryContext pattern)
  mutations.ts                  ← write functions (QueryContext pattern)
  index.ts                      ← barrel

src/hooks/entities/{kebab-case}/
  data/useFetch{Entity}s.ts     ← createDataFetchHook factory
  state/use{Entity}.ts          ← createCRUDHook factory

src/lib/translations/{pluralCamel}.ts  ← Czech strings
```

## Supabase client rules

| Context | What to use |
|---|---|
| Client component / browser | `supabaseBrowserClient()` from `@/utils/supabase/client` |
| Server component | `supabaseServerClient()` from `@/utils/supabase/server` |
| API route (authenticated) | `withAuth(handler)` from `@/utils/supabase/apiHelpers` |
| API route (admin only) | `withAdminAuth(handler)` from `@/utils/supabase/apiHelpers` |
| API route (public) | `withPublicAccess(handler)` from `@/utils/supabase/apiHelpers` |
| Coach role checks in API routes | `hasCoachRole()` / `isAdmin()` / `checkCoachCardAccess()` from `@/utils/supabase/coachAuth` — these are **auth helpers, not clients** |

Never import a server client in a client component or vice versa.
Prefer `apiHelpers` wrappers over calling `supabaseServerClient()` directly in API routes — they handle auth, 401/403, and error responses consistently.

## Query pattern

All query/mutation functions in `src/queries/` receive `ctx: QueryContext` as first argument and use `ctx.supabase`. Never call the Supabase client directly inside query files.

## Barrel exports

These files are **auto-generated** — never edit manually, always regenerate:
- `src/hooks/index.ts`
- `src/types/index.ts`
- `src/components/index.ts`

These files are **manual** — always update by hand:
- `src/lib/api-routes.ts`
- `src/lib/translations/index.ts`

# Database Migrations

Migration files live in `scripts/migrations/` with naming: `{YYYYMMDD}_{snake_case_description}.sql`.
Always include the standard header (see `/new-migration` skill). RLS policies are required for every new table.

# Quality Gates

Pre-commit: ESLint + Prettier + `tsc`
Pre-push: full test suite (`npm run test:run`)

Before suggesting a commit, verify `npm run tsc` and `npm run lint` pass.
