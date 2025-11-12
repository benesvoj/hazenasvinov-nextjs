# API Helper Utilities

Comprehensive authentication and authorization utilities for Next.js API routes, eliminating boilerplate code and providing consistent error handling.

## 📚 Table of Contents

- [Overview](#overview)
- [Available Helpers](#available-helpers)
- [Migration Guide](#migration-guide)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

The API helpers provide a clean, consistent way to handle authentication, authorization, and error handling in API routes. They follow the DRY principle and reduce code duplication across your API endpoints.

### Benefits

✅ **Less Boilerplate** - No more repeated auth checks in every route
✅ **Type Safety** - Full TypeScript support with proper types
✅ **Consistent Error Handling** - Standardized error responses
✅ **Better Security** - Enforced authentication patterns
✅ **Easier Testing** - Mock helpers instead of individual routes
✅ **Cleaner Code** - Focus on business logic, not auth logic

## Available Helpers

### `withAuth(handler)`

Wraps a route with authentication. Returns 401 if user is not authenticated.

```typescript
import { withAuth } from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  return withAuth(async (user, supabase) => {
    // user is guaranteed to be authenticated
    const {data} = await supabase.from('posts').select('*').eq('author_id', user.id);
    return NextResponse.json({data});
  });
}
```

### `withAdminAuth(handler)`

Wraps a route with admin authentication. Returns 401 if not authenticated, 403 if not admin.

```typescript
import { withAdminAuth } from '@/utils/supabase/apiHelpers';

export async function DELETE(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase) => {
    // user is guaranteed to be an admin
    await supabase.from('users').delete().eq('id', params.id);
    return NextResponse.json({success: true});
  });
}
```

### `withOptionalAuth(handler)`

Allows both authenticated and unauthenticated access. User can be null.

```typescript
import { withOptionalAuth } from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest) {
  return withOptionalAuth(async (user, supabase) => {
    const query = supabase.from('posts').select('*');

    if (user) {
      // Show private + public posts for authenticated users
      query.or(`is_public.eq.true,author_id.eq.${user.id}`);
    } else {
      // Only public posts for guests
      query.eq('is_public', true);
    }

    const {data} = await query;
    return NextResponse.json({data});
  });
}
```

### `validateBody(body, requiredFields)`

Validates request body has required fields.

```typescript
import { withAuth, validateBody, errorResponse } from '@/utils/supabase/apiHelpers';

export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body = await request.json();
    const validation = validateBody(body, ['name', 'email', 'age']);

    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing.join(', ')}`,
        400
      );
    }

    // Proceed with valid body...
  });
}
```

### `successResponse(data, status)`

Type-safe success response builder.

```typescript
import { successResponse } from '@/utils/supabase/apiHelpers';

return successResponse({ user, profile }, 200);
// Returns: { data: { user, profile }, error: null }
```

### `errorResponse(message, status)`

Type-safe error response builder.

```typescript
import { errorResponse } from '@/utils/supabase/apiHelpers';

return errorResponse('Category not found', 404);
// Returns: { error: 'Category not found' }
```

## Migration Guide

### Before (Old Pattern)

```typescript
// ❌ Lots of boilerplate
export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Check if admin
    const {data: profile} = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({error: 'Forbidden'}, {status: 403});
    }

    const {data, error} = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    if (!data) {
      return NextResponse.json({error: 'Not found'}, {status: 404});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {error: error.message || 'Internal server error'},
      {status: 500}
    );
  }
}
```

### After (New Pattern)

```typescript
// ✅ Clean and focused on business logic
import { withAdminAuth, errorResponse, successResponse } from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(data);
  });
}
```

## Examples

### Example 1: Simple Authenticated Route

```typescript
// src/app/api/posts/route.ts
import { NextRequest } from 'next/server';
import { withAuth, successResponse } from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data} = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id);

    return successResponse(data);
  });
}
```

### Example 2: Admin-Only CRUD

```typescript
// src/app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { withAdminAuth, errorResponse, successResponse } from '@/utils/supabase/apiHelpers';

export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase) => {
    const body = await request.json();

    const {data, error} = await supabase
      .from('users')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}

export async function DELETE(request: NextRequest, {params}: {params: {id: string}}) {
  return withAdminAuth(async (user, supabase) => {
    const {error} = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return successResponse({success: true});
  });
}
```

### Example 3: Nested Dynamic Routes with Validation

```typescript
// src/app/api/categories/[id]/fees/[feeId]/route.ts
import { NextRequest } from 'next/server';
import { withAdminAuth, errorResponse, successResponse } from '@/utils/supabase/apiHelpers';

export async function PATCH(
  request: NextRequest,
  {params}: {params: {id: string; feeId: string}}
) {
  return withAdminAuth(async (user, supabase) => {
    const body = await request.json();

    // Verify fee belongs to category
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', params.feeId)
      .eq('category_id', params.id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const {data, error} = await supabase
      .from('category_membership_fees')
      .update({
        ...body,
        updated_by: user.id,
      })
      .eq('id', params.feeId)
      .eq('category_id', params.id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}
```

### Example 4: Optional Authentication

```typescript
// src/app/api/posts/public/route.ts
import { NextRequest } from 'next/server';
import { withOptionalAuth, successResponse } from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest) {
  return withOptionalAuth(async (user, supabase) => {
    let query = supabase.from('posts').select('*');

    // Customize query based on authentication status
    if (user) {
      // Authenticated: show public + user's private posts
      query = query.or(`is_public.eq.true,author_id.eq.${user.id}`);
    } else {
      // Guest: only public posts
      query = query.eq('is_public', true);
    }

    const {data, error} = await query;
    if (error) throw error;

    return successResponse(data);
  });
}
```

### Example 5: Body Validation

```typescript
// src/app/api/categories/route.ts
import { NextRequest } from 'next/server';
import { withAdminAuth, validateBody, errorResponse, successResponse } from '@/utils/supabase/apiHelpers';

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase) => {
    const body = await request.json();

    // Validate required fields
    const validation = validateBody(body, ['name', 'description', 'age_group']);

    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing.join(', ')}`,
        400
      );
    }

    const {data, error} = await supabase
      .from('categories')
      .insert({
        ...body,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
```

## Best Practices

### ✅ DO

- **Use `withAuth` for all authenticated routes**
- **Use `withAdminAuth` for admin-only operations**
- **Throw errors** inside handlers - they'll be caught automatically
- **Use `successResponse` and `errorResponse`** for consistent responses
- **Validate inputs** before database operations
- **Check resource ownership** (e.g., fee belongs to category)

### ❌ DON'T

- **Don't manually check authentication** - use the helpers
- **Don't create custom error handling** - let helpers handle it
- **Don't return inconsistent response formats**
- **Don't skip validation** on user inputs
- **Don't use deprecated `createClient()` directly** in new API routes

## Migration Checklist

When refactoring an existing API route:

- [ ] Replace `createClient()` with appropriate helper
- [ ] Remove manual `auth.getUser()` calls
- [ ] Remove manual admin role checks
- [ ] Remove try-catch blocks (helpers handle this)
- [ ] Use `successResponse()` and `errorResponse()`
- [ ] Simplify error handling (just throw errors)
- [ ] Add proper JSDoc comments
- [ ] Test the refactored route

## Future Deprecations

The following patterns are deprecated for API routes:

```typescript
// ⚠️ DEPRECATED for API routes
import { createClient } from '@/utils/supabase/server';

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
// ... manual auth checks
```

Instead use:

```typescript
// ✅ RECOMMENDED
import { withAuth } from '@/utils/supabase/apiHelpers';

export async function GET() {
  return withAuth(async (user, supabase) => {
    // user is already authenticated
  });
}
```

**Note:** `createClient()` is still valid for Server Components, just not recommended for API routes.

## Questions?

For questions or issues with the API helpers, please refer to:
- Source code: `src/utils/supabase/apiHelpers.ts`
- Example implementations: `src/app/api/categories/[id]/`
