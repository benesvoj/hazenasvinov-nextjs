Orchestrate the full Supabase type synchronization workflow for this project.

This skill should be used after a DB migration has been applied to the Supabase project and you need to bring the TypeScript types in sync with the current database schema.

## Steps to execute (in order)

### Step 1 — Regenerate raw Supabase types

```bash
npm run db:generate-types
```

This calls the Supabase CLI (`supabase gen types typescript`) and writes output to `src/types/database/supabase.ts`.

**Requires env vars**: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`
If the command fails, check that these are set in the shell environment or `.env.local`.

### Step 2 — Split types into entity-specific schema files

```bash
npm run db:generate-schemas
```

This runs `scripts/split-db-types.js` which reads `src/types/database/supabase.ts` and writes/updates individual `*Schema.ts` files in `src/types/entities/*/schema/`.

**Important**: These files are marked `⚠️ AUTO-GENERATED — DO NOT EDIT MANUALLY`. After this step, any manual additions to schema files (e.g. custom Insert/Update types or extra interfaces) will be overwritten. Verify the output and restore any manual additions if needed.

### Step 3 — Regenerate all barrel exports

Run all generators in this order:

```bash
npm run generate:enums
npm run generate:types
npm run generate:hooks
npm run generate:components
npm run generate:api-routes
```

Or check if a combined script exists: `npm run generate:all` (run `npm run` to list available scripts first).

### Step 4 — Type-check the result

```bash
npm run tsc
```

Fix any TypeScript errors introduced by schema changes before committing.

---

## After sync

Report to the user:
- Which entity schema files were updated (diff `src/types/entities/`)
- Any new tables that appeared (new schema files created)
- Any tables that disappeared (schema files that were deleted or went empty)
- TypeScript errors found in step 4, grouped by file

Suggest running `npm run lint` if there were structural changes to imports or barrel exports.