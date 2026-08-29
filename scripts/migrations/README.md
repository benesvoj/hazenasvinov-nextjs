# Schema history — already applied, never re-run

These 34 migrations were applied to production by hand, one at a time, between
2024-12-15 and 2026-08-29, before the repository tracked migrations at all. They
are here so the history of the schema lives in the repository rather than on one
laptop.

## They are not run by anything

CI applies `supabase/migrations/` and nothing else. Nothing in this directory is
executed by `supabase db push`, `supabase db reset`, or any workflow.

**Do not copy them into `supabase/migrations/`.** Production has no record of
them in `supabase_migrations.schema_migrations` — that table was created by the
first CI push on 2026-08-29 and only knows about migrations from that point on.
Moving a file from here into `supabase/migrations/` would make `db push` apply it
a second time: `CREATE TABLE` and `ALTER TABLE` against a live database with real
data in it.

If you need the schema they build, use the baseline migration in
`supabase/migrations/` instead. That is what a from-scratch build is for.

## Where new migrations go

`supabase/migrations/`, named `<YYYYMMDDHHMMSS>_<description>.sql`. They are
applied by `.github/workflows/database.yml` on merge to `main`, behind a review
in the `database-production` environment. Never by hand — a hand-applied
migration is invisible to `schema_migrations` and pulls the two out of sync.

## One file is not a migration

`rollback_attendance_stats.sql` undoes the attendance statistics work rather than
applying it. It is kept for the same reason as the rest: it is part of the
history of how this schema got here.

## 20260829_exclude_deactivated_members_from_attendance_stats.sql

A pointer, not a migration. That one moved to `supabase/migrations/` and is
applied by CI; the stub is left behind so anyone following an older reference
lands somewhere that says where it went.
