# Supabase Clients Guide

> **Complete reference for using Supabase clients in this project.**
> Understanding which client to use where is critical for security and functionality.

---

## Quick Reference

| Import From | Client Name | Use In | RLS | Auth Method |
|-------------|-------------|--------|-----|-------------|
| `@/hooks` | `useSupabaseClient()` | **Client Components, Hooks, Contexts** | ✅ Enforced | Browser session |
| `@/utils/supabase/server` | `createClient()` | Server Components, Server Actions | ✅ Enforced | Cookie session |
| `@/utils/supabase/apiHelpers` | `withAuth()` | API Routes | ✅ Enforced | Validated user |
| `@/utils/supabase/apiHelpers` | `withAdminAuth()` | API Routes (admin) | Both | Admin user |
| `@/utils/supabase/admin` | `supabaseAdmin` | API Routes ONLY (bypass RLS) | ❌ Bypassed | Service role |

---

## Client Types Explained

### 1. Browser Client - `useSupabaseClient()` Hook ⭐ RECOMMENDED

**For:** Client Components (`'use client'`), Hooks, Contexts, any browser-side code

**Key Characteristics:**
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for browser)
- Respects Row Level Security (RLS)
- User authentication via browser session
- Memoized - no unnecessary re-creations
- Safe to expose - no sensitive keys

**Import:**
```typescript
import { useSupabaseClient } from '@/hooks';
```

**Usage in Component:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@/hooks';

export function MyComponent() {
  const supabase = useSupabaseClient();
  const [data, setData] = useState(null);

  useEffect(() => {
    supabase.from('posts').select('*').then(({ data }) => setData(data));
  }, [supabase]);

  return <div>{/* render data */}</div>;
}
```

**Usage in Custom Hook:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/hooks';

export function usePosts() {
  const supabase = useSupabaseClient();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, [supabase]);

  return { posts, loading };
}
```

**Usage in Context Provider:**
```typescript
'use client';

import { createContext, useCallback } from 'react';
import { useSupabaseClient } from '@/hooks';

export function MyProvider({ children }) {
  const supabase = useSupabaseClient();

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, [supabase]);

  // ...
}
```

**Why use the hook instead of direct import?**

| Aspect | Direct `createSupabaseBrowser()` | `useSupabaseClient()` Hook |
|--------|----------------------------------|---------------------------|
| `useMemo` required | Yes - easy to forget | Built-in |
| Imports needed | `useMemo` + `createSupabaseBrowser` | Just the hook |
| Single point of change | No | Yes |
| Future extensibility | Hard | Easy to enhance |

> **Note:** For advanced use cases, `createSupabaseBrowser()` is available from `@/utils/supabase/browser`

---

### 2. Server Client (`@/utils/supabase/server`)

**For:** Server Components, Server Actions, Middleware

**Key Characteristics:**
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Respects Row Level Security (RLS)
- User authentication via cookies
- Async function - must be awaited

**Import:**
```typescript
import { createClient } from '@/utils/supabase/server';
```

**Usage in Server Component:**
```typescript
// NO 'use client' - this is a Server Component
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      {posts?.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
```

**Usage in Server Action:**
```typescript
'use server';

import { createClient } from '@/utils/supabase/server';

export async function createPost(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: formData.get('title'),
      author_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

### 3. Admin Client (`@/utils/supabase/admin`)

**For:** API Routes ONLY - Never in client code!

**Key Characteristics:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only secret)
- **BYPASSES Row Level Security (RLS)**
- Full database access - no restrictions
- Key is NOT available in browser (Next.js security feature)

**⚠️ CRITICAL SECURITY RULES:**
- NEVER import in files with `'use client'`
- NEVER import in contexts, hooks, or components
- ONLY use in API routes (`/app/api/`)
- When in doubt, use `withAuth` or `withAdminAuth` instead

**Import:**
```typescript
import supabaseAdmin from '@/utils/supabase/admin';
```

**Usage in API Route:**
```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  // Use admin client for operations that need to bypass RLS
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'user@example.com',
    password: 'password123',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
```

---

### 4. API Helpers (`@/utils/supabase/apiHelpers`) - **RECOMMENDED**

**For:** API Routes - The preferred way to handle authentication

**Key Characteristics:**
- Built-in authentication validation
- Automatic error handling
- Provides both RLS-respecting and admin clients
- Standardized response formats

**Import:**
```typescript
import {
  withAuth,
  withAdminAuth,
  withPublicAccess,
  withOptionalAuth,
  successResponse,
  errorResponse
} from '@/utils/supabase/apiHelpers';
```

#### `withAuth` - Authenticated Routes

```typescript
// src/app/api/posts/route.ts
import { withAuth, successResponse, errorResponse } from '@/utils/supabase/apiHelpers';

export async function GET() {
  return withAuth(async (user, supabase) => {
    // user is guaranteed to be authenticated
    // supabase respects RLS (sees only user's data)

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id);

    if (error) return errorResponse(error.message, 500);
    return successResponse(data);
  });
}
```

#### `withAdminAuth` - Admin-Only Routes

```typescript
// src/app/api/admin/categories/route.ts
import { withAdminAuth, successResponse, errorResponse } from '@/utils/supabase/apiHelpers';

export async function PATCH(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    // user is guaranteed to be an admin
    // supabase - respects RLS (for user-specific queries)
    // admin - bypasses RLS (for system operations)

    const body = await request.json();

    // Use admin for system-level updates
    const { data, error } = await admin
      .from('categories')
      .update(body)
      .eq('id', body.id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return successResponse(data);
  });
}
```

#### `withPublicAccess` - Public Routes

```typescript
// src/app/api/public/posts/route.ts
import { withPublicAccess, successResponse } from '@/utils/supabase/apiHelpers';

export async function GET() {
  return withPublicAccess(async (supabase) => {
    // No authentication required
    // supabase respects RLS (public policies)

    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('is_public', true);

    return successResponse(data);
  });
}
```

#### `withOptionalAuth` - Optional Authentication

```typescript
// src/app/api/posts/[id]/route.ts
import { withOptionalAuth, successResponse } from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withOptionalAuth(async (user, supabase) => {
    // user can be null (unauthenticated) or User object

    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .eq('id', params.id)
      .single();

    // Add extra data for authenticated users
    if (user && data) {
      const { data: liked } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', params.id)
        .eq('user_id', user.id)
        .single();

      data.isLiked = !!liked;
    }

    return successResponse(data);
  });
}
```

---

## Decision Tree: Which Client to Use?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WHICH SUPABASE CLIENT TO USE?                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  What type of file are you working in?                                      │
│  │                                                                          │
│  ├─► Client Component ('use client')                                        │
│  │   └─► Use: useSupabaseClient() from @/hooks                             │
│  │                                                                          │
│  ├─► Custom Hook ('use client')                                             │
│  │   └─► Use: useSupabaseClient() from @/hooks                             │
│  │                                                                          │
│  ├─► Context Provider ('use client')                                        │
│  │   └─► Use: useSupabaseClient() from @/hooks                             │
│  │                                                                          │
│  ├─► Server Component (no directive)                                        │
│  │   └─► Use: await createClient() from @/utils/supabase/server            │
│  │                                                                          │
│  ├─► Server Action ('use server')                                           │
│  │   └─► Use: await createClient() from @/utils/supabase/server            │
│  │                                                                          │
│  └─► API Route (/app/api/*)                                                 │
│      │                                                                      │
│      ├─► Need user authentication?                                          │
│      │   └─► Use: withAuth() from @/utils/supabase/apiHelpers              │
│      │                                                                      │
│      ├─► Need admin-only access?                                            │
│      │   └─► Use: withAdminAuth() from @/utils/supabase/apiHelpers         │
│      │                                                                      │
│      ├─► Public endpoint?                                                   │
│      │   └─► Use: withPublicAccess() from @/utils/supabase/apiHelpers      │
│      │                                                                      │
│      └─► Need to bypass RLS (system operation)?                             │
│          └─► Use: withAdminAuth() and use the admin parameter              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Using Admin Client in Client Component

```typescript
// ❌ WRONG - SECURITY ISSUE
'use client';
import supabaseAdmin from '@/utils/supabase/admin';  // NEVER DO THIS!

export function MyComponent() {
  // This will fail because SUPABASE_SERVICE_ROLE_KEY is not available in browser
  // Even if it worked, it would be a major security vulnerability
}
```

```typescript
// ✅ CORRECT
'use client';
import { useSupabaseClient } from '@/hooks';

export function MyComponent() {
  const supabase = useSupabaseClient();
  // Safe and correct
}
```

### ❌ Mistake 2: Using Server Client in Client Component

```typescript
// ❌ WRONG - Will fail at runtime
'use client';
import { createClient } from '@/utils/supabase/server';  // Server-only!

export function MyComponent() {
  // This will fail because cookies() is server-only
}
```

```typescript
// ✅ CORRECT
'use client';
import { useSupabaseClient } from '@/hooks';

export function MyComponent() {
  const supabase = useSupabaseClient();
}
```

### ❌ Mistake 3: Not Awaiting Server Client

```typescript
// ❌ WRONG - createClient returns a Promise
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = createClient();  // Missing await!
  const { data } = await supabase.from('posts').select();  // Will fail
}
```

```typescript
// ✅ CORRECT
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();  // Properly awaited
  const { data } = await supabase.from('posts').select();
}
```

### ❌ Mistake 4: Using Admin Client When Not Needed

```typescript
// ❌ WRONG - Bypassing RLS unnecessarily
import supabaseAdmin from '@/utils/supabase/admin';

export async function GET() {
  // Using admin to read user's own posts - RLS should handle this!
  const { data } = await supabaseAdmin.from('posts').select();
}
```

```typescript
// ✅ CORRECT - Let RLS do its job
import { withAuth, successResponse } from '@/utils/supabase/apiHelpers';

export async function GET() {
  return withAuth(async (user, supabase) => {
    // RLS automatically filters to user's posts
    const { data } = await supabase.from('posts').select();
    return successResponse(data);
  });
}
```

---

## File Organization

```
src/hooks/shared/
└── useSupabaseClient.ts  # ⭐ Primary hook for client-side code

src/utils/supabase/
├── browser.ts          # Browser client factory (used by hook)
├── server.ts           # Server client (Server Components, Actions)
├── admin.ts            # Admin client (API Routes ONLY)
├── apiHelpers.ts       # API route helpers (withAuth, etc.)
├── client.ts           # Internal: browser client implementation
├── middleware.ts       # Next.js middleware utilities
├── index.ts            # Minimal exports (avoid client/server conflicts)
└── docs/
    ├── SUPABASE_CLIENTS_GUIDE.md  # This file
    ├── API_HELPERS_README.md       # Detailed API helpers guide
    └── RLS_VS_ADMIN_GUIDE.md       # When to bypass RLS
```

---

## Import Cheatsheet

```typescript
// ============================================
// CLIENT-SIDE (Components, Hooks, Contexts)
// ============================================
import { useSupabaseClient } from '@/hooks';

// ============================================
// SERVER-SIDE (Server Components, Actions)
// ============================================
import { createClient } from '@/utils/supabase/server';

// ============================================
// API ROUTES (Recommended)
// ============================================
import {
  withAuth,
  withAdminAuth,
  withPublicAccess,
  withOptionalAuth,
  successResponse,
  errorResponse
} from '@/utils/supabase/apiHelpers';

// ============================================
// API ROUTES (Admin/Bypass RLS - Use sparingly)
// ============================================
import supabaseAdmin from '@/utils/supabase/admin';
```

---

## Migration Guide

If you have existing code using the old patterns, here's how to migrate:

### From `createClient()` in Client Components

```typescript
// ❌ OLD
'use client';
import { useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

export function MyComponent() {
  const supabase = useMemo(() => createClient(), []);
}

// ✅ NEW
'use client';
import { useSupabaseClient } from '@/hooks';

export function MyComponent() {
  const supabase = useSupabaseClient();
}
```

### From `supabaseAdmin` in Client Components

```typescript
// ❌ OLD (broken and insecure)
'use client';
import supabaseAdmin from '@/utils/supabase/admin';

export function MyComponent() {
  // This doesn't work - service role key not available in browser
}

// ✅ NEW
'use client';
import { useSupabaseClient } from '@/hooks';

export function MyComponent() {
  const supabase = useSupabaseClient();
}
```

### From `createSupabaseBrowser()` with useMemo

```typescript
// ❌ OLD (verbose)
'use client';
import { useMemo } from 'react';
import { createSupabaseBrowser } from '@/utils/supabase/browser';

export function MyComponent() {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
}

// ✅ NEW (cleaner)
'use client';
import { useSupabaseClient } from '@/hooks';

export function MyComponent() {
  const supabase = useSupabaseClient();
}
```

### From Direct `createClient()` in API Routes

```typescript
// ❌ OLD
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // ...
}

// ✅ NEW
import { withAuth, successResponse } from '@/utils/supabase/apiHelpers';

export async function GET() {
  return withAuth(async (user, supabase) => {
    // Authentication already handled
    // ...
    return successResponse(data);
  });
}
```

---

## Summary

| Scenario | Import | Usage |
|----------|--------|-------|
| **Client Component** | `@/hooks` | `useSupabaseClient()` |
| **Custom Hook** | `@/hooks` | `useSupabaseClient()` |
| **Context Provider** | `@/hooks` | `useSupabaseClient()` |
| **Server Component** | `@/utils/supabase/server` | `await createClient()` |
| **Server Action** | `@/utils/supabase/server` | `await createClient()` |
| **API Route (auth)** | `@/utils/supabase/apiHelpers` | `withAuth()` |
| **API Route (admin)** | `@/utils/supabase/apiHelpers` | `withAdminAuth()` |
| **API Route (public)** | `@/utils/supabase/apiHelpers` | `withPublicAccess()` |
| **API Route (bypass RLS)** | `@/utils/supabase/admin` | `supabaseAdmin` |

---

## TL;DR - Just Tell Me What to Import

```typescript
// In client components, hooks, contexts:
import { useSupabaseClient } from '@/hooks';
const supabase = useSupabaseClient();

// In server components:
import { createClient } from '@/utils/supabase/server';
const supabase = await createClient();

// In API routes:
import { withAuth } from '@/utils/supabase/apiHelpers';
return withAuth(async (user, supabase) => { ... });
```

---

*Last updated: 2026-01-28*
