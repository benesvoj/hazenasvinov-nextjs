# Repo improvement plan

Written 2026-08-29 from an audit of the repository, ordered by what actually
hurts. Every number here was measured, not estimated — the command that produced
it is given so the figure can be re-checked rather than trusted.

This file is itself subject to item 6: keep it current or delete it when the
items are done. A stale plan is worse than none.

---

## 1. The database schema exists on one laptop — 34 migrations outside the repo

**Status:** in progress

`.gitignore` excludes all of `scripts/`, so 34 of 36 migrations — including the
ones that create tables — have a single copy, on one machine.

```bash
ls scripts/migrations/*.sql | wc -l    # 34, untracked
ls supabase/migrations/*.sql | wc -l   # 2, tracked
```

If that disk dies the production database keeps running, but nobody can rebuild
a development environment or reconstruct why the schema looks the way it does.

The same gap makes CI weaker than it looks: `supabase db reset` builds a database
from `supabase/migrations` alone, so the `verify` job proves the migrations
*apply*, not that they produce production's schema.

**Steps**

- [ ] Track the 34 historical migrations. They are already applied to production
      and must NOT go into `supabase/migrations`, or `db push` would replay
      `CREATE TABLE` against a live database. They belong in the repo as history.
- [ ] Add a baseline migration holding the current schema, so a from-scratch
      build reproduces production.
- [ ] `supabase migration repair --status applied <baseline version>` against
      production, so the baseline is never applied there.
- [ ] Confirm `supabase db reset` then produces a schema matching production.

**Do this first.** Everything below is friction; this one is a one-off loss.

---

## 2. The camelCase / snake_case filter trap, still in two query files

**Status:** open

`src/app/api/entities/config.ts` maps query parameters onto DB columns, so the
query layer receives snake_case. Two files still declare camelCase:

| file | declares | route actually sends |
|---|---|---|
| `src/queries/categoryLineups/queries.ts` | `categoryId`, `seasonId` | `category_id`, `season_id` |
| `src/queries/trainingSessions/queries.ts` | `categoryId`, `seasonId` | `category_id`, `season_id` |

Both then do `filters: options?.filters`, and `applyFilters` puts the key
straight into `.eq(key, value)`. Anyone who follows the declared type filters on
a column that does not exist — silently, because the interface says otherwise.

Fixed today in `categoryLineupMembers` and (after Copilot caught it)
`memberAttendance`. Two left.

The root cause is that `applyFilters` accepts any string as a column name, so
neither a typo nor the wrong convention has anywhere to fail.

**Steps**

- [ ] Rename the filter keys in both files to the DB column names.
- [ ] Derive the filter type from the generated DB schema in
      `src/types/database/supabase.ts` so this cannot be written wrong again.

---

## 3. Test coverage is 2.2 %

**Status:** open

```bash
find src -name '*.ts' -o -name '*.tsx' | grep -v __tests__ | wc -l   # 1290
find src -path '*__tests__*' -name '*.test.ts*' | wc -l              # 28
```

Not an argument for chasing a percentage. It is an argument for covering the
layers where a silent mistake is expensive and a test is cheap to write:
`src/queries/` and `src/helpers/` are plain functions with no UI to mount.

Worth remembering why: on 2026-08-29 three separate errors in hand-written SQL
survived review and were caught only by running it, and the camelCase filter
above was caught only once a test started asserting the column name.

**Steps**

- [ ] Cover the rest of `src/queries/` the way `categoryLineupMembers` and
      `memberAttendance` now are — the filter shape and the select shape.
- [ ] Cover `src/helpers/` — they are pure and currently mostly untested.

---

## 4. 423 `any` and 77 `console.log`

**Status:** open

```bash
grep -rn ": any\b\|<any>\|as any" src --include='*.ts' --include='*.tsx' | grep -v __tests__ | wc -l   # 423
grep -rn "console\.log" src --include='*.ts' --include='*.tsx' | grep -v __tests__ | wc -l             # 77
```

`any` in the query layer is why item 2 can exist at all: `config.ts` passes
options as `any`, so the mismatch has nowhere to surface.

`src/app/error.tsx:35` logs error parameters to the browser console.

**Steps**

- [ ] Type the `EntityQueryLayer` options in `config.ts` instead of `any`.
- [ ] Remove `console.log` from `src/app/error.tsx` and the admin pages, or move
      it behind a debug flag.

---

## 5. `exec_sql` still exists

**Status:** open

A function that executes arbitrary SQL. `anon` and `authenticated` lost EXECUTE
on 2026-08-07 and 2026-08-29, but the function is still in the database and
`src/app/api/admin/update-materialized-view/route.ts:92` calls it through the
admin client.

While it exists it is one authorization mistake away from full control of the
database. What it is used for can be written as a specific function with fixed
SQL.

**Steps**

- [ ] Replace the `exec_sql` call in `update-materialized-view` with a purpose-built
      function.
- [ ] `DROP FUNCTION public.exec_sql(text)`.

---

## 6. Documentation has outgrown the code

**Status:** open

```bash
find docs -name '*.md' | wc -l              # 224
find docs/refactoring -name '*.md' | wc -l  # 55
```

Ten of them cover the todo system. PR #34 was closed on 2026-08-29 because its
"Current State Analysis" described paths that had not existed for a year.

Documentation nobody maintains is worse than none: it reads as authoritative and
is wrong.

**Steps**

- [ ] Delete what describes finished refactorings.
- [ ] Keep what still holds, and date it.

---

## 7. Smaller things

- [ ] Four empty stub components in coach attendance (7–9 lines each) that
      `CLAUDE.md` still points at: `AttendanceTrendsChart`, `InsightsPanel`,
      `MemberPerformanceTable`, `RecommendationsPanel`. Implement or remove.
- [ ] `DEFAULT_DRAW_PROBABILITY = 0.27` in `oddsGeneratorService.ts` is
      commented "27% draw rate in football". This is a handball club; draws there
      run nearer 8–10 %. It is the dominant term in the formula, so the betting
      model is calibrated for the wrong sport. A product decision, not a
      refactor — but someone should decide it.
- [ ] 152 lint warnings, mostly `react-hooks/set-state-in-effect`.
- [ ] `supabase/config.toml` still logs `WARN: config section [inbucket] is
      deprecated. Please use [local_smtp] instead.` on every start.

---

## What is already good

Worth not breaking while fixing the above.

The `queries` / `hooks` / `features` layering is consistent and easy to follow.
`CLAUDE.md` is unusually good — concrete tables of conventions rather than
general advice. The security migration of 2026-08-07 gets the revoke right
(`FROM PUBLIC, anon, authenticated`), which is what showed the 2026-08-10 one to
be an oversight rather than a misunderstanding. Generating barrels and DB types
is exactly the kind of automation that keeps a repo this size coherent.
