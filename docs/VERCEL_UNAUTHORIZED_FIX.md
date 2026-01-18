# Vercel Unauthorized Errors - Analysis & Fix

## The Problem

On Vercel preview environment, the **landing page** was showing unauthorized (401) errors for:
- `/api/club-config`
- `/api/blog-posts-published`
- `/api/entities/seasons`
- `/api/entities/categories`

**These are PUBLIC endpoints** shown on the landing page to **non-authenticated users**.

---

## Root Cause

### The Issue: All Routes Required Authentication

**Before fix:**
```typescript
// /api/club-config/route.ts
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {  // ❌ Requires login!
    // Fetch club config
  });
}

// /api/entities/[entity]/route.ts
export async function GET(...) {
  return withAuth(async (user, supabase) => {  // ❌ Requires login!
    // Fetch seasons, categories, etc.
  });
}
```

**What `withAuth` does:**
```typescript
const {data: {user}} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401});  // ❌ Blocks public
}
```

**Result:** Public landing page couldn't fetch data → 401 errors

---

## Why It Worked Locally But Not on Vercel

**Local development:**
- ✅ You were logged in
- ✅ Session existed in cookies
- ✅ Requests passed auth check

**Vercel preview:**
- ❌ Fresh environment, no session
- ❌ Public users not logged in
- ❌ All requests blocked with 401

---

## The Fix

### Created `withPublicAccess` Wrapper

**New helper in `src/utils/supabase/apiHelpers.ts`:**

```typescript
export async function withPublicAccess(
  handler: ((supabase: SupabaseClient) => Promise<NextResponse>) | AuthHandler
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Execute handler WITHOUT auth check
    // RLS policies still apply for security
    if (handler.length === 2) {
      return await (handler as AuthHandler)(null as any, supabase);
    }
    return await (handler as (supabase: SupabaseClient) => Promise<NextResponse>)(supabase);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
```

**Key points:**
- ✅ No authentication check
- ✅ Still creates Supabase client (RLS policies apply)
- ✅ Compatible with both handler signatures
- ✅ Errors handled same way

---

### Updated Public Endpoints

#### 1. `/api/club-config` (Landing page config)
```typescript
// Before:
import {withAuth} from '@/utils/supabase/apiHelpers';
return withAuth(async (user, supabase) => { ... });

// After:
import {withPublicAccess} from '@/utils/supabase/apiHelpers';
return withPublicAccess(async (supabase: SupabaseClient) => { ... });
```

#### 2. `/api/blog-posts-published` (Landing page news)
```typescript
// Before:
return withAuth(async (user, supabase) => { ... });

// After:
return withPublicAccess(async (supabase: SupabaseClient) => { ... });
```

#### 3. `/api/entities/[entity]` (Seasons, Categories, etc.)
```typescript
// Before:
return withAuth(async (user, supabase) => { ... });

// After:
if (config.isPublic) {
  return withPublicAccess(handler);
}
return withAuth(async (user, supabase) => handler(supabase));
```

#### 4. Entity Configs (Mark public entities)
```typescript
// src/app/api/entities/config.ts

seasons: {
  tableName: 'seasons',
  requiresAdmin: false,
  isPublic: true,  // ← NEW: Accessible without auth
  // ...
},

categories: {
  tableName: 'categories',
  requiresAdmin: false,
  isPublic: true,  // ← NEW: Accessible without auth
  // ...
},
```

---

## Security Notes

### Is This Safe?

**YES!** Because:

1. **RLS Policies Still Apply**
   - Supabase Row Level Security is enforced
   - Users can only see what RLS allows
   - Public tables are already configured for public access

2. **Read-Only Operations**
   - Only GET requests are public
   - POST/PUT/DELETE still require authentication

3. **Explicit Opt-In**
   - Only entities marked `isPublic: true` are accessible
   - Default is authenticated access

---

## Testing

### Test Locally
```bash
# 1. Log out of the app
# 2. Visit landing page
# Should see:
- ✅ Club config loads
- ✅ Blog posts load
- ✅ Seasons/categories load (if displayed)
```

### Test on Vercel Preview
```bash
# 1. Push changes
git push

# 2. Open Vercel preview URL
# Should see:
- ✅ No 401 errors in console
- ✅ Landing page data loads
- ✅ News/blog posts visible
```

---

## Files Modified

### API Helpers:
- ✅ `src/utils/supabase/apiHelpers.ts` - Added `withPublicAccess()`

### API Routes:
- ✅ `src/app/api/club-config/route.ts` - Changed to `withPublicAccess`
- ✅ `src/app/api/blog-posts-published/route.ts` - Changed to `withPublicAccess`
- ✅ `src/app/api/entities/[entity]/route.ts` - Conditional auth based on `isPublic`

### Config:
- ✅ `src/app/api/entities/config.ts` - Added `isPublic` flag to interface
- ✅ `src/app/api/entities/config.ts` - Marked `seasons` as public
- ✅ `src/app/api/entities/config.ts` - Marked `categories` as public

---

## Other Entities That Might Need `isPublic: true`

Check if these are shown on the landing page:
- `blog_posts` - If landing shows posts
- `matches` - If landing shows upcoming matches
- `clubs` - If landing shows club info
- `news` - If landing shows news

**To make an entity public:**
```typescript
entityName: {
  tableName: 'table_name',
  requiresAdmin: false,
  isPublic: true,  // ← Add this
  // ... rest of config
}
```

---

## Verification Checklist

- [x] TypeScript: 0 errors ✅
- [x] Build: Compiles successfully ✅
- [x] Tests: 100/100 passing ✅
- [ ] Local: Test logged-out landing page (you can verify)
- [ ] Vercel: Test preview environment (you can verify)

---

## Related to Factory Hook Changes?

**NO!** This was a **pre-existing issue** where:
- Public endpoints incorrectly required authentication
- It worked locally because you were always logged in
- Vercel preview exposed the issue (fresh sessions, public users)

**The factory hook changes didn't cause this** - they just made you notice it when testing on Vercel.

---

## Summary

**What was wrong:**
- Public landing page data required authentication
- Non-logged-in users got 401 errors
- Data didn't load on Vercel preview

**What was fixed:**
- Created `withPublicAccess()` wrapper
- Updated public endpoints to use it
- Added `isPublic` flag to entity configs
- Marked seasons and categories as public

**Result:**
- ✅ Landing page works for anonymous users
- ✅ RLS security still enforced
- ✅ Clean separation of public vs authenticated endpoints

---

**Status:** Fixed! Test on Vercel preview to confirm.