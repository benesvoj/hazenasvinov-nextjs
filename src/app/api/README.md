# API Routes Documentation

This directory contains all API routes for the application using Next.js 15 App Router conventions.

## Table of Contents

- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Helper Functions](#helper-functions)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Common Patterns](#common-patterns)
- [Migration Guide](#migration-guide)

---

## Overview

Our API routes follow Next.js 15 App Router conventions with file-based routing. Each `route.ts` file in the `api` directory becomes an API endpoint that can handle HTTP methods (GET, POST, PATCH, DELETE, etc.).

### Key Features

- **Type-safe**: Full TypeScript support
- **Authentication**: Built-in auth helpers with Supabase
- **Authorization**: Admin-only route wrappers
- **Error Handling**: Consistent error responses across all routes
- **RLS Support**: Choose between user-context or admin-context database queries

---

## Folder Structure

### Basic Structure

```
src/app/api/
├── README.md                          # This file
├── [resource]/
│   ├── route.ts                       # Collection routes (GET, POST)
│   └── [id]/
│       ├── route.ts                   # Single resource routes (GET, PATCH, DELETE)
│       └── [nested-resource]/
│           └── route.ts               # Nested resource routes
```

### Examples from Our Codebase

```
api/
├── members/
│   ├── route.ts                       # GET /api/members, POST /api/members
│   ├── [id]/
│   │   ├── route.ts                   # GET /api/members/:id, PATCH /api/members/:id, DELETE /api/members/:id
│   │   └── relationships/
│   │       └── route.ts               # GET /api/members/:id/relationships
│   ├── internal/
│   │   └── route.ts                   # GET /api/members/internal
│   └── external/
│       └── route.ts                   # GET /api/members/external
├── categories/
│   ├── route.ts                       # GET /api/categories, POST /api/categories
│   └── [id]/
│       ├── route.ts                   # GET /api/categories/:id, PATCH /api/categories/:id
│       └── fees/
│           ├── route.ts               # GET /api/categories/:id/fees, POST /api/categories/:id/fees
│           └── [feeId]/
│               └── route.ts           # GET /api/categories/:id/fees/:feeId, PATCH, DELETE
├── committees/
│   ├── route.ts                       # GET /api/committees
│   └── [id]/
│       └── route.ts                   # GET /api/committees/:id, PATCH /api/committees/:id
└── auth/
    ├── reset-password/
    │   └── route.ts
    └── simple-reset-password/
        └── route.ts
```

### Naming Conventions

- **Folders**: Use kebab-case for multi-word names (e.g., `member-payments/`)
- **Dynamic Segments**: Use `[id]` or `[paramName]` for URL parameters
- **Route Files**: Always named `route.ts`

---

## Helper Functions

All helper functions are located in `@/utils/supabase/apiHelpers.ts`

### Authentication Wrappers

#### `withAuth(handler)`

Wraps a route with authentication check. Returns 401 if user is not authenticated.

**Use when**: Any route that requires a logged-in user.

```typescript
import {withAuth} from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    // user: User object (guaranteed to exist)
    // supabase: SupabaseClient with user context (respects RLS)

    const {data} = await supabase.from('members').select('*');
    return NextResponse.json({data});
  });
}
```

#### `withAdminAuth(handler)`

Wraps a route with admin authentication and authorization check. Returns 401 if not authenticated, 403 if not admin.

**Use when**: Routes that should only be accessible by admins.

```typescript
import {withAdminAuth} from '@/utils/supabase/apiHelpers';

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    // user: Admin user object
    // supabase: SupabaseClient with user context (respects RLS)
    // admin: SupabaseClient with service role (bypasses RLS)

    const {id} = await params;
    const body = await request.json();

    // Use 'admin' for operations that need to bypass RLS
    const {data} = await admin.from('categories').update(body).eq('id', id).select().single();
    return successResponse(data);
  });
}
```

**When to use which client?**
- Use `supabase` for queries that should respect RLS (most GET operations)
- Use `admin` for operations that need to bypass RLS (bulk updates, system operations)

#### `withOptionalAuth(handler)`

Wraps a route with optional authentication. Does NOT return 401 if user is not authenticated - passes `null` instead.

**Use when**: Public routes that may have user-specific features.

```typescript
import {withOptionalAuth} from '@/utils/supabase/apiHelpers';

export async function GET(request: NextRequest) {
  return withOptionalAuth(async (user, supabase) => {
    // user: User object or null

    const query = supabase.from('posts').select('*');

    if (user) {
      // Show private posts for authenticated users
      query.or(`is_public.eq.true,author_id.eq.${user.id}`);
    } else {
      // Public posts only
      query.eq('is_public', true);
    }

    const {data} = await query;
    return NextResponse.json({data});
  });
}
```

### Response Helpers

#### `successResponse(data, status?)`

Returns a standardized success response.

```typescript
import {successResponse} from '@/utils/supabase/apiHelpers';

const data = await supabase.from('members').select('*');
return successResponse(data);
// Returns: { data: [...], error: null } with status 200

return successResponse(newMember, 201);
// Returns: { data: {...}, error: null } with status 201
```

#### `errorResponse(message, status?)`

Returns a standardized error response.

```typescript
import {errorResponse} from '@/utils/supabase/apiHelpers';

if (!categoryId) {
  return errorResponse('Category ID is required', 400);
}
// Returns: { error: "Category ID is required" } with status 400

return errorResponse('Not found', 404);
// Returns: { error: "Not found" } with status 404
```

### Validation Helpers

#### `validateBody(body, requiredFields)`

Validates that all required fields are present in request body.

```typescript
import {validateBody, errorResponse} from '@/utils/supabase/apiHelpers';

export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body = await request.json();
    const validation = validateBody(body, ['name', 'email', 'category_id']);

    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing.join(', ')}`,
        400
      );
    }

    // Proceed with creation...
  });
}
```

#### `prepareUpdateData(body, excludeFields?, includeTimestamp?)`

Sanitizes request body for database updates by:
- Filtering out `undefined` values
- Excluding specified fields (default: `['id']`)
- Automatically adding `updated_at` timestamp (default: true)

```typescript
import {prepareUpdateData} from '@/utils/supabase/apiHelpers';

export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body = await request.json();

    // Filters out undefined, removes 'id', adds 'updated_at'
    const updateData = prepareUpdateData(body);

    const {data} = await admin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return successResponse(data);
  });
}

// Custom exclusions and no timestamp
const updateData = prepareUpdateData(
  body,
  ['id', 'created_at', 'created_by'],
  false
);
```

---

## Best Practices

### 1. Always Use Helper Functions

**Bad:**
```typescript
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase.from('members').select('*');

    if (error) {
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
```

**Good:**
```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase.from('members').select('*');
    if (error) throw error;
    return successResponse(data);
  });
}
```

### 2. Properly Handle Dynamic Route Params

In Next.js 15, `params` is a Promise and must be awaited.

**Correct:**
```typescript
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  return withAuth(async (user, supabase) => {
    const {id} = await params; // ✅ Await params
    const {data} = await supabase.from('members').eq('id', id).single();
    return successResponse(data);
  });
}
```

**Wrong:**
```typescript
// ❌ Don't do this
const {id} = params; // params is a Promise, not an object
```

### 3. Handle Nested Routes Properly

For nested routes, validate that resources belong together.

```typescript
// api/categories/[id]/fees/[feeId]/route.ts

export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{id: string; feeId: string}>}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id, feeId} = await params;

    // Verify the fee belongs to this category
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', feeId)
      .eq('category_id', id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const body = await request.json();
    const updateData = prepareUpdateData(body);

    const {data, error} = await admin
      .from('category_membership_fees')
      .update(updateData)
      .eq('id', feeId)
      .eq('category_id', id) // Always include parent ID
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}
```

### 4. Use Query Parameters

Access query parameters via `request.nextUrl.searchParams`.

```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear();
    const isActive = searchParams.get('is_active') === 'true';

    const {data} = await supabase
      .from('fees')
      .select('*')
      .eq('calendar_year', year)
      .eq('is_active', isActive);

    return successResponse(data);
  });
}
```

### 5. Consistent Error Handling

Throw errors inside helpers - they will be caught automatically.

```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase.from('members').select('*');

    // Throw database errors - they're caught by withAuth wrapper
    if (error) throw error;

    // Return custom validation errors
    if (!data || data.length === 0) {
      return errorResponse('No members found', 404);
    }

    return successResponse(data);
  });
}
```

### 6. Admin vs Regular Supabase Client

```typescript
export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body = await request.json();

    // ✅ Use 'supabase' for reads (respects RLS, more secure)
    const {data: existing} = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) {
      return errorResponse('Member not found', 404);
    }

    // ✅ Use 'admin' for writes that need to bypass RLS
    const updateData = prepareUpdateData(body);
    const {data} = await admin
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return successResponse(data);
  });
}
```

### 7. Document Your Routes

Add JSDoc comments to explain what each route does.

```typescript
/**
 * GET /api/members/[id] - Get single member by ID
 *
 * @requires Authentication
 * @returns Member object with all fields
 */
export async function GET(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAuth(async (user, supabase) => {
    // ...
  });
}

/**
 * PATCH /api/members/[id] - Update member (Admin only)
 *
 * @requires Admin authentication
 * @body Partial member object with fields to update
 * @returns Updated member object
 */
export async function PATCH(request: NextRequest, {params}: {params: Promise<{id: string}>}) {
  return withAdminAuth(async (user, supabase, admin) => {
    // ...
  });
}
```

---

## Examples

### Example 1: Simple Collection Route (GET, POST)

**File**: `api/members/route.ts`

```typescript
import {NextRequest, NextResponse} from 'next/server';
import {
  withAuth,
  withAdminAuth,
  successResponse,
  errorResponse,
  validateBody,
} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/members - List all members
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('members')
      .select('*')
      .order('surname', {ascending: true});

    if (error) throw error;
    return successResponse(data);
  });
}

/**
 * POST /api/members - Create new member (Admin only)
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();

    // Validate required fields
    const validation = validateBody(body, ['name', 'surname', 'registration_number']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing.join(', ')}`,
        400
      );
    }

    const {data, error} = await admin
      .from('members')
      .insert({
        name: body.name.trim(),
        surname: body.surname.trim(),
        registration_number: body.registration_number.trim(),
        date_of_birth: body.date_of_birth ?? null,
        sex: body.sex,
        functions: body.functions,
        category_id: body.category_id ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return successResponse(data, 201);
  });
}
```

### Example 2: Single Resource Route (GET, PATCH, DELETE)

**File**: `api/members/[id]/route.ts`

```typescript
import {NextRequest, NextResponse} from 'next/server';
import {
  withAuth,
  withAdminAuth,
  successResponse,
  errorResponse,
  prepareUpdateData,
} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/members/[id] - Get single member
 */
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  return withAuth(async (user, supabase) => {
    const {id} = await params;

    const {data, error} = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Member not found', 404);
    }

    return successResponse(data);
  });
}

/**
 * PATCH /api/members/[id] - Update member (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body = await request.json();

    const updateData = prepareUpdateData(body);

    const {data, error} = await admin
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}

/**
 * DELETE /api/members/[id] - Delete member (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;

    const {error} = await admin.from('members').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({success: true, error: null});
  });
}
```

### Example 3: Nested Resource Route

**File**: `api/categories/[id]/fees/route.ts`

```typescript
import {NextRequest, NextResponse} from 'next/server';
import {
  withAuth,
  withAdminAuth,
  successResponse,
} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/categories/[id]/fees - Get all fees for a category
 * Query params: ?year=2024
 */
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  return withAuth(async (user, supabase) => {
    const {id} = await params;
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear();

    const {data, error} = await supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('category_id', id)
      .eq('calendar_year', year)
      .eq('is_active', true)
      .order('fee_amount', {ascending: false});

    if (error) throw error;
    return successResponse(data);
  });
}

/**
 * POST /api/categories/[id]/fees - Create new fee (Admin only)
 */
export async function POST(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id} = await params;
    const body = await request.json();

    const {data, error} = await admin
      .from('category_membership_fees')
      .insert({
        ...body,
        category_id: id, // Ensure category_id matches URL
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return successResponse(data, 201);
  });
}
```

### Example 4: Deeply Nested Route

**File**: `api/categories/[id]/fees/[feeId]/route.ts`

```typescript
import {NextRequest, NextResponse} from 'next/server';
import {
  withAuth,
  withAdminAuth,
  successResponse,
  errorResponse,
  prepareUpdateData,
} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/categories/[id]/fees/[feeId] - Get single fee
 */
export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{id: string; feeId: string}>}
) {
  return withAuth(async (user, supabase) => {
    const {id, feeId} = await params;

    const {data, error} = await supabase
      .from('category_membership_fees')
      .select('*, categories(name)')
      .eq('id', feeId)
      .eq('category_id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return errorResponse('Fee not found', 404);
    }

    return successResponse(data);
  });
}

/**
 * PATCH /api/categories/[id]/fees/[feeId] - Update specific fee (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{id: string; feeId: string}>}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id, feeId} = await params;
    const body = await request.json();

    // Verify the fee belongs to this category
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', feeId)
      .eq('category_id', id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const updateData = prepareUpdateData(body);

    const {data, error} = await admin
      .from('category_membership_fees')
      .update(updateData)
      .eq('id', feeId)
      .eq('category_id', id)
      .select()
      .single();

    if (error) throw error;
    return successResponse(data);
  });
}

/**
 * DELETE /api/categories/[id]/fees/[feeId] - Delete specific fee (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  {params}: {params: Promise<{id: string; feeId: string}>}
) {
  return withAdminAuth(async (user, supabase, admin) => {
    const {id, feeId} = await params;

    // Verify before deleting
    const {data: existingFee} = await supabase
      .from('category_membership_fees')
      .select('id')
      .eq('id', feeId)
      .eq('category_id', id)
      .single();

    if (!existingFee) {
      return errorResponse('Fee not found or does not belong to this category', 404);
    }

    const {error} = await admin
      .from('category_membership_fees')
      .delete()
      .eq('id', feeId)
      .eq('category_id', id);

    if (error) throw error;
    return NextResponse.json({success: true, error: null});
  });
}
```

### Example 5: Query Parameters and Filtering

**File**: `api/members/internal/route.ts`

```typescript
import {NextRequest} from 'next/server';
import {withAuth, successResponse} from '@/utils/supabase/apiHelpers';

/**
 * GET /api/members/internal - Get internal members with filtering
 * Query params: ?category_id=123&year=2024&search=John
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('category_id');
    const year = searchParams.get('year');
    const search = searchParams.get('search');

    let query = supabase
      .from('members')
      .select('*, categories(name)')
      .eq('type', 'internal');

    // Apply optional filters
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (year) {
      query = query.eq('year', year);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,surname.ilike.%${search}%,registration_number.ilike.%${search}%`
      );
    }

    const {data, error} = await query.order('surname', {ascending: true});

    if (error) throw error;
    return successResponse(data);
  });
}
```

---

## Common Patterns

### Pattern 1: CRUD Operations for a Resource

Create all four operations (Create, Read, Update, Delete) following this structure:

```
api/[resource]/
├── route.ts                    # GET (list), POST (create)
└── [id]/
    └── route.ts                # GET (single), PATCH (update), DELETE (delete)
```

### Pattern 2: Sub-resources

For resources that belong to a parent:

```
api/[parent]/[parentId]/[child]/
├── route.ts                    # GET (list children), POST (create child)
└── [childId]/
    └── route.ts                # GET, PATCH, DELETE for specific child
```

### Pattern 3: Special Actions

For actions that don't fit CRUD:

```
api/admin/
└── update-materialized-view/
    └── route.ts                # POST /api/admin/update-materialized-view
```

### Pattern 4: Relationships

For managing many-to-many relationships:

```
api/members/[id]/relationships/
└── route.ts                    # GET, POST, DELETE relationships for a member
```

---

## Migration Guide

### From Old Pattern to New Pattern

**Old (verbose):**
```typescript
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {data: {user}} = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase.from('members').select('*');

    if (error) {
      console.error('Error:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
```

**New (clean):**
```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase.from('members').select('*');
    if (error) throw error;
    return successResponse(data);
  });
}
```

### Steps to Migrate

1. Import helper functions:
   ```typescript
   import {
     withAuth,
     withAdminAuth,
     successResponse,
     errorResponse,
     prepareUpdateData,
     validateBody,
   } from '@/utils/supabase/apiHelpers';
   ```

2. Replace try-catch blocks with `withAuth` or `withAdminAuth`

3. Replace manual auth checks with wrapper functions

4. Replace `NextResponse.json({data, error: null})` with `successResponse(data)`

5. Replace `NextResponse.json({error: message}, {status})` with `errorResponse(message, status)`

6. For PATCH routes, use `prepareUpdateData(body)` to sanitize input

7. For POST routes, use `validateBody(body, requiredFields)` to validate input

---

## Testing API Routes

### Using curl

```bash
# GET request
curl http://localhost:3000/api/members

# POST request
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{"name":"John","surname":"Doe","registration_number":"12345"}'

# PATCH request
curl -X PATCH http://localhost:3000/api/members/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane"}'

# DELETE request
curl -X DELETE http://localhost:3000/api/members/123
```

### Using fetch in Browser/Client Components

```typescript
// GET
const response = await fetch('/api/members');
const {data, error} = await response.json();

// POST
const response = await fetch('/api/members', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'John',
    surname: 'Doe',
    registration_number: '12345',
  }),
});
const {data, error} = await response.json();

// PATCH
const response = await fetch(`/api/members/${id}`, {
  method: 'PATCH',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({name: 'Jane'}),
});
const {data, error} = await response.json();

// DELETE
const response = await fetch(`/api/members/${id}`, {
  method: 'DELETE',
});
const {success, error} = await response.json();
```

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: User is not logged in. Check authentication in frontend.

2. **403 Forbidden**: User is not an admin. Check `user_profiles.role` in database.

3. **500 Internal Server Error**: Database query failed. Check error logs and Supabase RLS policies.

4. **Cannot read properties of undefined (reading 'id')**: Forgot to `await params`. Always use `const {id} = await params`.

5. **Import errors with apiHelpers**: Make sure to import from the correct path:
   ```typescript
   // ✅ Correct
   import {withAuth} from '@/utils/supabase/apiHelpers';

   // ❌ Wrong (will cause client/server errors)
   import {withAuth} from '@/utils';
   ```

---

## Resources

- [Next.js 15 Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase JavaScript Client Documentation](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Questions or Issues?

If you encounter issues or have questions about API route patterns, please:

1. Check this README first
2. Review existing API routes for similar examples
3. Check `@/utils/supabase/apiHelpers.ts` for detailed JSDoc comments
4. Ask the team for clarification

---

**Last Updated**: 2025-10-23