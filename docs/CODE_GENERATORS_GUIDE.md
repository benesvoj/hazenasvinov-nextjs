# Code Generators Guide

## Overview

The project has 4 code generator scripts that create barrel exports and API constants.

**Important:** These generators are NO LONGER run automatically on git commit (removed from lint-staged to avoid unnecessary changes).

---

## Available Generators

### 1. `npm run generate:hooks`
**What it does:** Generates `src/hooks/index.ts` with all hook exports

**Run when:**
- ✅ You create a new hook file
- ✅ You rename a hook file
- ✅ You delete a hook file
- ✅ Hook exports are missing/broken

**Don't run when:**
- ❌ Just modifying hook implementation (no new exports)

---

### 2. `npm run generate:components`
**What it does:** Generates index.ts files in `src/components/*` folders

**Run when:**
- ✅ You create a new component
- ✅ You rename a component
- ✅ You delete a component
- ✅ Component imports are broken

**Don't run when:**
- ❌ Just modifying component code (no new exports)

---

### 3. `npm run generate:types`
**What it does:** Generates `src/types/index.ts` with all type exports

**Run when:**
- ✅ You create a new type file
- ✅ You rename a type file
- ✅ You delete a type file
- ✅ Type imports are broken

**Don't run when:**
- ❌ Just modifying type definitions (no new exports)

---

### 4. `npm run generate:api-routes`
**What it does:** Generates `src/lib/api-routes.ts` with API route constants

**Run when:**
- ✅ You create a new API route
- ✅ You rename an API route
- ✅ You delete an API route
- ✅ API_ROUTES constants are missing

**Don't run when:**
- ❌ Just modifying API route implementation

---

## Quick Reference

```bash
# After adding/removing hooks
npm run generate:hooks

# After adding/removing components
npm run generate:components

# After adding/removing types
npm run generate:types

# After adding/removing API routes
npm run generate:api-routes

# Run all generators
npm run generate:hooks && npm run generate:components && npm run generate:types && npm run generate:api-routes
```

---

## Why Removed from Pre-Commit?

**Before:**
- Generators ran on EVERY commit
- Added timestamps to files (changed on every commit)
- Caused unnecessary git changes
- Slowed down commits

**After:**
- Generators run MANUALLY when needed
- No timestamps (stable files)
- Faster commits
- Only change when actually needed

---

## Best Practices

### When Adding New Files

**Workflow:**
1. Create new hook/component/type
2. **Run the appropriate generator**
3. Commit everything together

**Example:**
```bash
# 1. Create new hook
code src/hooks/entities/newEntity/data/useFetchNewEntity.ts

# 2. Generate exports
npm run generate:hooks

# 3. Commit both
git add src/hooks/entities/newEntity/data/useFetchNewEntity.ts
git add src/hooks/index.ts
git commit -m "feat: add useFetchNewEntity hook"
```

---

### When Refactoring

**After renaming/moving files:**
```bash
# Run relevant generator
npm run generate:hooks  # or components, or types

# Check what changed
git status

# Commit the generator changes
git add src/hooks/index.ts
git commit -m "chore: update hook exports after refactoring"
```

---

## CI/CD Integration (Optional)

You could add generators to CI to verify they're up-to-date:

```yaml
# .github/workflows/ci.yml
- name: Verify generators are up-to-date
  run: |
    npm run generate:hooks
    npm run generate:components
    npm run generate:types
    git diff --exit-code || (echo "Generators out of date! Run npm run generate:* locally" && exit 1)
```

---

## Troubleshooting

### Import errors after adding new file?
```bash
# Run the appropriate generator
npm run generate:hooks  # or components, or types
```

### Generator changes files unexpectedly?
**This should no longer happen** (timestamps removed). If it does:
- Check if you actually added/removed files
- Verify the generator scripts aren't adding dynamic content

### Want generators back in pre-commit?
Edit `package.json` and add back to `lint-staged`:
```json
"src/hooks/**/*.ts": [
  "npm run generate:hooks"
]
```

---

## Generator Scripts Location

All scripts in `scripts/` folder:
- `generate-hook-exports.mjs`
- `generate-component-exports.mjs`
- `generate-type-exports.mjs`
- `generate-api-routes.mjs`

**Modified today:** Removed timestamps from all generators

---

## Summary

**What changed:**
- ✅ Removed timestamps from generators (no more date changes)
- ✅ Removed generators from lint-staged (manual control)
- ✅ Faster commits (no unnecessary regeneration)

**How to use:**
- Run generators manually when adding/removing files
- Don't run on every commit
- Commit generator changes separately if needed

**Benefits:**
- Cleaner git diffs
- Faster commits
- More control
- No spurious changes

---

**Status:** Generators optimized for manual use
