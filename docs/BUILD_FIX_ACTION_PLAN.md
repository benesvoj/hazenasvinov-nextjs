# Build Fix - Action Plan (Option C)

## Current Situation

**Status:** Build fails intermittently on various pages
**Root Cause:** Factory hooks execute at module-level when Next.js analyzes pages
**Affected:** 40+ client pages that import from `@/hooks`

**Error:**
```
Error: Attempted to call createDataFetchHook() from the server
Failed to collect page data for /chronicle, /about, /betting, etc.
```

---

## The Problem Explained

### Module-Level Execution Issue

**Your current factory pattern:**
```typescript
// src/hooks/entities/video/data/useFetchVideos.ts
export const useFetchVideos = createDataFetchHook({...});  // ← Executes when imported!
```

**What happens during build:**
```
Next.js build process
  ↓
Analyzes all pages (including client-only)
  ↓
Imports @/hooks barrel (142 exports)
  ↓
Executes ALL factory calls
  ↓
createDataFetchHook({...}) tries to run
  ↓
❌ Error: Can't run client code on server
```

---

## Solution Options (Ranked)

### 🥇 Option 1: Fix Factory Pattern (PROPER FIX)
**Convert factories from module-level to lazy execution**

**Time:** 1-2 days
**Risk:** Low (can test each change)
**Value:** Fixes root cause permanently

### 🥈 Option 2: Add 'use client' to Barrel Export
**Force hooks barrel to be client-only**

**Time:** 5 minutes
**Risk:** May work or may not
**Value:** Quick test

### 🥉 Option 3: Disable Static Generation
**Tell Next.js to skip prerendering**

**Time:** 10 minutes
**Risk:** Loses Next.js benefits
**Value:** Workaround only

---

## RECOMMENDED: Start with Option 2 (Quick Test)

### Step 1: Test Quick Fix (5 minutes)

Already done! `src/hooks/index.ts` has `'use client'`

But let me verify it's at the top:

```typescript
'use client';  // ← Must be first line!

export * from './admin/useExcelImport';
// ... rest of exports
```

---

### Step 2: If That Doesn't Work → Option 1 (Proper Fix)

**The proper fix is to change factory pattern:**

#### Before (Module-Level):
```typescript
// Executes when file is imported
export const useFetchVideos = createDataFetchHook({
  endpoint: '/api/videos',
  entityName: 'videos',
  errorMessage: 'Failed',
});
```

#### After (Lazy Execution):
```typescript
// Only executes when called
export function useFetchVideos() {
  return createDataFetchHook({
    endpoint: '/api/videos',
    entityName: 'videos',
    errorMessage: 'Failed',
  })();
}
```

**Key difference:** Function wrapper delays execution until called in component.

**Files to update:** ~40 hook files (can be done incrementally!)

---

## Implementation Plan for Option 1

### Phase 1: Update Factory Functions (1 hour)

Change the factory implementations to support both patterns:

```typescript
// src/hooks/factories/createDataFetchHook.ts

// Keep current implementation but export a lazy version too:
export function createDataFetchHookLazy<T>(config: DataFetchHookConfig) {
  return function() {
    return createDataFetchHook(config)();
  };
}
```

Actually, simpler - just change the hooks themselves!

### Phase 2: Convert Hooks One by One

**Script to find all hooks using factories:**
```bash
grep -r "= createDataFetchHook\|= createCRUDHook" src/hooks/entities --include="*.ts" | wc -l
```

**Template for each conversion:**
```typescript
// FROM:
export const useFetchVideos = createDataFetchHook({...});

// TO:
export function useFetchVideos() {
  return createDataFetchHook({...})();
}
```

**Time per file:** 30 seconds (find/replace)
**Total files:** ~40
**Total time:** 20-30 minutes

---

## Step-by-Step Action Plan (TODAY)

### ✅ Step 1: Verify 'use client' in hooks barrel (DONE)

Already has it!

### ✅ Step 2: Test if build works now

```bash
rm -rf .next && npm run build
```

### If Still Failing → Step 3: Convert Factory Calls

**Do this:**

```bash
# Find all factory-created hooks
find src/hooks/entities -name "*.ts" | xargs grep -l "= createDataFetchHook\|= createCRUDHook"

# For each file, change:
# export const useFetch... = createDataFetchHook({...});
# TO:
# export function useFetch...() { return createDataFetchHook({...})(); }
```

**I can help you do this with a script or tool!**

---

## Alternative: The Nuclear Option (If Time is Critical)

### Option 3: Disable Static Optimization

**File:** `next.config.mjs`

```javascript
const nextConfig = {
  // Disable static page generation temporarily
  experimental: {
    ppr: false,
  },
  // Force all pages to be dynamic
  dynamicParams: true,

  // Existing config...
};
```

**Then add to each problematic page:**
```typescript
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
```

**Pros:** Immediate fix (5 minutes)
**Cons:** Loses static generation benefits, not a real fix

---

## My Recommendation for RIGHT NOW

### Immediate Action (Next 30 Minutes):

1. **Let's try a build** to see current status
2. **If fails** → Convert 5-10 most-used hooks to lazy pattern
3. **Test build again**
4. **If still fails** → Add dynamic config temporarily
5. **Document as tech debt** to fix properly later

### This Week:

6. Get build working (any method)
7. Fix or skip the 6 tests
8. Merge to main
9. Create new branch for proper factory refactor

### Next Week:

10. Proper factory pattern fix (if needed)
11. Start converting pages incrementally

---

## Let's Start Now

**I recommend we:**

1. **First, try current build** (already has 'use client' in barrel)
2. **If that worked** → Great! Move to tests
3. **If still failing** → I'll help you bulk-convert the factory hooks (30 min task)

**Want me to:**
- Check if build is passing now?
- Show you how to bulk-convert factory hooks?
- Or try the nuclear option (dynamic config)?

**What do you prefer?** Let's get this build working today! 🚀