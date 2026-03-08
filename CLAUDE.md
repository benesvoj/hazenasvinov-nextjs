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

### Excluding files or folders from barrel generation

The component barrel generator (`scripts/generate-component-exports.mjs`) supports two opt-out mechanisms:

**File-level** — add `// @barrel-ignore` on any of the first 5 lines of a `.ts`/`.tsx` file:
```ts
// @barrel-ignore
export const myHelper = ...
```

**Folder-level** — drop an empty `.barrel-ignore` file inside the directory:
```
SomeComponent/utils/.barrel-ignore
```

Use these for utility/helper files that live inside a component folder but are **not** public API (e.g. `UnifiedTopBar/utils/`). The generator logs `⏭️  Skipping ...` for every excluded path so you can verify it worked.

## Layout components

Use these components instead of writing raw Tailwind flex/grid classes. They enforce consistent spacing and responsive breakpoints across the app.

**Important:** Tailwind CSS does not support dynamic class construction (e.g. `` `flex-${direction}` ``). All layout components use static lookup maps to generate classes. Follow this pattern when creating new layout components.

### Grid / GridItem — Responsive grid layouts

```tsx
import {Grid, GridItem} from '@/components';

// Equal-width columns (responsive: 1 col mobile → N cols desktop)
<Grid columns={3} gap="md">
  <GridItem><Card>...</Card></GridItem>
  <GridItem><Card>...</Card></GridItem>
  <GridItem><Card>...</Card></GridItem>
</Grid>

// Unequal spanning — layout concern stays in the parent, not the child
<Grid columns={3}>
  <GridItem span={1}><Sidebar /></GridItem>
  <GridItem span={2}><MainContent /></GridItem>
</Grid>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `Grid.columns` | `1-6` | `3` | Number of columns at largest breakpoint |
| `Grid.gap` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Gap between items |
| `GridItem.span` | `1-6` | `1` | Number of columns this item spans |

Files: `src/components/ui/Grid/Grid.tsx`, `src/components/ui/Grid/components/GridItem.tsx`

### HStack / VStack — Flex row/column layouts

```tsx
import {HStack, VStack} from '@/components';

<HStack spacing={2} align="center">         {/* flex-row gap-2 items-center */}
  <Icon /><span>Label</span>
</HStack>

<VStack spacing={4} align="start">           {/* flex-col gap-4 items-start */}
  <Card>...</Card>
  <Card>...</Card>
</VStack>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `spacing` | `0-12` | `0` | Gap between items (maps to Tailwind `gap-N`) |
| `align` | `'start' \| 'end' \| 'center' \| 'stretch' \| 'baseline'` | `'center'` | Cross-axis alignment |
| `justify` | `'start' \| 'end' \| 'center' \| 'between' \| 'around'` | `'start'` | Main-axis alignment |
| `wrap` | `boolean` | `false` | Allow wrapping |

Files: `src/components/ui/HStack/HStack.tsx`, `src/components/ui/VStack/VStack.tsx`, `src/components/ui/Stack/Stack.tsx` (base)

### When to use which

| Need | Use | Not |
|---|---|---|
| Responsive multi-column grid | `<Grid columns={3}>` | Manual `grid grid-cols-...` classes |
| Unequal column widths in grid | `<GridItem span={2}>` | `col-span-X` on child components |
| Horizontal row of items | `<HStack spacing={2}>` | `<div className="flex gap-2">` |
| Vertical stack of items | `<VStack spacing={4}>` | `<div className="flex flex-col gap-4">` or `space-y-X` |

# Database Migrations

Migration files live in `scripts/migrations/` with naming: `{YYYYMMDD}_{snake_case_description}.sql`.
Always include the standard header (see `/new-migration` skill). RLS policies are required for every new table.

# Quality Gates

Pre-commit: ESLint + Prettier + `tsc`
Pre-push: full test suite (`npm run test:run`)

Before suggesting a commit, verify `npm run tsc` and `npm run lint` pass.
