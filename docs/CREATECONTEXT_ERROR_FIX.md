# createContext Error - Diagnosis & Fix

## The Error

```
Runtime TypeError: createContext only works in Client Components.
Add the "use client" directive at the top of the file to use it.
```

**Where:** Landing page and public pages
**When:** After converting admin pages to Server Components

---

## Root Cause

### Duplicate Query Client Files

You had **TWO query client files** with different implementations:

1. **`src/lib/queryClient.ts`** (OLD - Sept 2024)
   ```typescript
   // Creates singleton at module level
   export const queryClient = new QueryClient({...});  // ❌ Module-level execution
   export const devQueryClient = new QueryClient({...});  // ❌ Module-level execution

   export function getQueryClient() {
     if (process.env.NODE_ENV === 'development') {
       return devQueryClient;  // Returns singleton
     }
     return queryClient;  // Returns singleton
   }
   ```

2. **`src/lib/getQueryClient.ts`** (NEW - Created today)
   ```typescript
   // Creates instance based on server/client context
   export function getQueryClient() {
     if (typeof window === 'undefined') {
       return new QueryClient({...});  // ✅ New instance per request (server)
     }
     if (!browserQueryClient) {
       browserQueryClient = new QueryClient({...});  // ✅ Singleton for browser
     }
     return browserQueryClient;
   }
   ```

### The Problem

**QueryProvider** was importing from the OLD file:
```typescript
import {getQueryClient} from '@/lib/queryClient';  // ❌ OLD singleton approach
```

**Old implementation:**
- Creates QueryClient at module level
- Not safe for Server Components
- Causes context errors in Next.js 16

---

## The Fix

### Updated QueryProvider Import

**File:** `src/components/providers/QueryProvider.tsx`

```typescript
// Before:
import {getQueryClient} from '@/lib/queryClient';  // ❌ OLD

// After:
import {getQueryClient} from '@/lib/getQueryClient';  // ✅ NEW
```

### Why This Fixes It

**NEW getQueryClient:**
- ✅ Server-safe (creates new instance per request)
- ✅ Client-safe (maintains singleton)
- ✅ Prevents data leaking between users
- ✅ Compatible with Next.js 16 App Router
- ✅ Works with Server Component hydration pattern

---

## What Should Happen Now

### Test These Pages (Should All Work):

**Public pages:**
- `/` (landing page) ✅
- `/blog` (blog listing) ✅
- `/blog/[slug]` (blog detail) ✅
- `/about` ✅
- `/contact` ✅
- `/chronicle` ✅

**Admin pages with Server Component pattern:**
- `/admin/seasons` ✅
- `/admin/committees` ✅
- `/admin/categories` ✅

**All should:**
- ✅ Load without createContext error
- ✅ Display data correctly
- ✅ No console errors

---

## Verification Steps

### 1. Clear Browser Cache & Restart Dev Server
```bash
# Kill dev server (Ctrl+C)
rm -rf .next
npm run dev
```

### 2. Test Landing Page
```bash
# Visit: http://localhost:3000
```

**Should see:**
- ✅ No createContext errors
- ✅ Hero section loads
- ✅ Blog posts display
- ✅ Match schedule shows

### 3. Test Blog Pages
```bash
# Visit: http://localhost:3000/blog
# Visit: http://localhost:3000/blog/some-slug
```

**Should see:**
- ✅ No errors
- ✅ Content loads

### 4. Test Admin Pages
```bash
# Visit: http://localhost:3000/admin/seasons
```

**Should see:**
- ✅ Instant load (no loading spinner!)
- ✅ Data displays
- ✅ CRUD operations work

---

## Technical Explanation

### Why Module-Level QueryClient is Bad

**Old approach (BAD for Server Components):**
```typescript
// Executes when module is imported
export const queryClient = new QueryClient({...});  // ❌ Runs at import time

// Server Component imports this:
import {getQueryClient} from '@/lib/queryClient';

// Result: QueryClient created in server context
// → Uses browser-only APIs
// → Causes createContext error
```

**New approach (GOOD for Server Components):**
```typescript
// Only executes when function is called
export function getQueryClient() {
  if (typeof window === 'undefined') {
    return new QueryClient({...});  // ✅ Safe for server
  }
  // ...browser code
}

// Server Component calls this:
const client = getQueryClient();  // ✅ Creates server-safe instance
```

---

## Future Prevention

### Rule of Thumb

**For any shared code used in Server Components:**

❌ **Don't create instances at module level:**
```typescript
export const instance = new SomeClass();  // Executes at import
```

✅ **Create instances in functions:**
```typescript
export function getInstance() {
  return new SomeClass();  // Executes when called
}
```

### Files to Watch

**These can cause issues if module-level:**
- QueryClient instances
- Context providers
- Any class instances using browser APIs
- Event listeners
- WebSocket connections

---

## Optional: Clean Up Old File

**You can delete the old file** (after verifying everything works):

```bash
# Verify nothing else imports it
grep -r "from '@/lib/queryClient'" src

# If no results, delete it
rm src/lib/queryClient.ts

# Or rename it for reference
mv src/lib/queryClient.ts src/lib/queryClient.ts.deprecated
```

**Benefits:**
- ✅ No confusion about which to use
- ✅ Cleaner codebase
- ✅ Prevents future mistakes

---

## Summary

**The Issue:**
- Old queryClient.ts created instances at module level
- Not compatible with Server Components
- Caused createContext error on public pages

**The Fix:**
- Updated QueryProvider to use new getQueryClient.ts
- New implementation is server/client aware
- Creates instances safely based on context

**Status:**
- ✅ Fixed in one line change
- ✅ TypeScript clean
- ✅ Should resolve all createContext errors

---

**Test it now and let me know if the error is gone!**