# Query Layer Extraction Guide
## Centralizing Database Queries for Better Maintainability

## Table of Contents
1. [What is a Query Layer?](#what-is-a-query-layer)
2. [Why Do We Need It?](#why-do-we-need-it)
3. [Current Problem Analysis](#current-problem-analysis)
4. [Proposed Solution](#proposed-solution)
5. [Implementation Guide](#implementation-guide)
6. [Complete Examples](#complete-examples)
7. [Migration Strategy](#migration-strategy)
8. [Benefits & Trade-offs](#benefits--trade-offs)
9. [Testing Strategy](#testing-strategy)
10. [Best Practices](#best-practices)

---

## What is a Query Layer?

A **Query Layer** is a dedicated layer in your application architecture that contains all database queries in one place. Instead of scattering SQL/Supabase queries across API routes, hooks, and components, you centralize them into reusable functions.

### Architecture Diagram

**Before (Current State):**
```
┌─────────────────────────────────────────────────┐
│           API Routes (54 files)                  │
│  Each contains inline Supabase queries          │
│  supabase.from('members').select('*')           │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│           Supabase Database                      │
└─────────────────────────────────────────────────┘

Problem: Queries duplicated across 54+ files!
```

**After (With Query Layer):**
```
┌─────────────────────────────────────────────────┐
│           API Routes (54 files)                  │
│  Import and use query functions                  │
│  const members = await getAllMembers()           │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│        Query Layer (Centralized)                 │
│  /src/queries/members/queries.ts                │
│  export async function getAllMembers() {...}     │
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│           Supabase Database                      │
└─────────────────────────────────────────────────┘

Solution: Single source of truth for all queries!
```

---

## Why Do We Need It?

### Current Problems in the Codebase

#### Problem 1: Query Duplication

**Example: Members Query Scattered Across Multiple Files**

**File 1:** `/src/app/api/members/route.ts` (Line 14-18)
```typescript
const {data, error} = await supabase
  .from('members')
  .select('*')
  .order('surname', {ascending: true})
  .order('name', {ascending: true});
```

**File 2:** `/src/app/api/members/internal/route.ts` (Similar query)
```typescript
const {data, error} = await supabase
  .from('members')
  .select('*')
  .eq('is_internal', true)
  .order('surname', {ascending: true})
  .order('name', {ascending: true});
```

**File 3:** `/src/services/memberQueries.ts` (If it existed)
```typescript
// Same query again...
```

**Problem:** If you need to change the sort order or add a filter, you need to update it in multiple places!

#### Problem 2: Testing Difficulty

How do you test a query that's embedded in an API route?

```typescript
// Current: Query is inside the route handler
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

// You have to test the entire route handler, authentication, and query together!
```

#### Problem 3: Query Evolution

What if you need to optimize a query with better select statements?

```typescript
// Current: Member query without joins
.select('*')

// Better: Member query with related data
.select(`
  *,
  member_functions(function_id, function_name),
  member_payments(amount, paid_at, status)
`)

// Problem: Need to update this in 54+ places!
```

#### Problem 4: No Type Safety for Query Results

```typescript
// Current: Generic query, no specific types
const {data, error} = await supabase.from('members').select('*');
// data is typed as any[] or Member[] but might not match reality

// With Query Layer: Explicit return types
async function getAllMembers(): Promise<MemberWithRelations[]> {
  // TypeScript knows exactly what you're getting back!
}
```

---

## Current Problem Analysis

### Query Inventory in the Codebase

Based on the architecture analysis, here's where queries are currently located:

| Location | Count | Examples | Issue |
|----------|-------|----------|-------|
| API Routes | 54 files | `/api/members/route.ts` | Duplication |
| Service Layer | 2 files | `matchQueries.ts` | Partial solution |
| Hooks | 38+ files | `useFetchMembers.ts` | Fetch API, not direct queries |
| Components | ~10 files | Direct fetch() calls | Mixed concerns |

### Example: Members Entity Queries

**Current State - Scattered Across:**

1. **GET all members** - `/api/members/route.ts:14`
2. **GET internal members** - `/api/members/internal/route.ts`
3. **GET external members** - `/api/members/external/route.ts`
4. **GET members on loan** - `/api/members/on-loan/route.ts`
5. **GET member by ID** - `/api/members/[id]/route.ts`
6. **POST create member** - `/api/members/route.ts:32`
7. **PATCH update member** - `/api/members/[id]/route.ts`
8. **DELETE member** - `/api/members/[id]/route.ts`

**Each file contains its own inline Supabase query!**

---

## Proposed Solution

### New Directory Structure

```
/src/queries/
├── members/
│   ├── queries.ts           ← SELECT queries (read operations)
│   ├── mutations.ts         ← INSERT, UPDATE, DELETE (write operations)
│   ├── types.ts             ← Query-specific types
│   └── index.ts             ← Re-export all functions
├── categories/
│   ├── queries.ts
│   ├── mutations.ts
│   ├── types.ts
│   └── index.ts
├── matches/
│   ├── queries.ts
│   ├── mutations.ts
│   ├── types.ts
│   └── index.ts
├── committees/
│   ├── queries.ts
│   ├── mutations.ts
│   ├── types.ts
│   └── index.ts
├── shared/
│   ├── queryBuilder.ts      ← Reusable query utilities
│   ├── filters.ts           ← Common filter functions
│   └── pagination.ts        ← Pagination utilities
└── index.ts                 ← Central export point
```

### Benefits of This Structure

1. **Single Source of Truth:** All queries for an entity in one place
2. **Easy to Find:** `queries.ts` for reads, `mutations.ts` for writes
3. **Reusable:** Import the same function in routes, services, or hooks
4. **Testable:** Test queries independently from API routes
5. **Type-Safe:** Explicit return types for each query
6. **Maintainable:** Change a query once, updates everywhere

---

## Implementation Guide

### Step 1: Create Base Types

**File:** `/src/queries/shared/types.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Standard query result wrapper
 */
export interface QueryResult<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort options
 */
export interface SortOptions {
  column: string;
  ascending?: boolean;
}

/**
 * Filter options (generic)
 */
export interface FilterOptions {
  [key: string]: any;
}

/**
 * Query context - passed to all query functions
 */
export interface QueryContext {
  supabase: SupabaseClient;
  userId?: string;
}
```

### Step 2: Create Query Utilities

**File:** `/src/queries/shared/queryBuilder.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { SortOptions, PaginationOptions } from './types';

/**
 * Apply sorting to a Supabase query
 */
export function applySorting<T>(
  query: any,
  sortOptions?: SortOptions[]
) {
  if (!sortOptions || sortOptions.length === 0) {
    return query;
  }

  let sortedQuery = query;
  for (const sort of sortOptions) {
    sortedQuery = sortedQuery.order(sort.column, {
      ascending: sort.ascending ?? true,
    });
  }

  return sortedQuery;
}

/**
 * Apply pagination to a Supabase query
 */
export function applyPagination<T>(
  query: any,
  pagination?: PaginationOptions
) {
  if (!pagination) {
    return query;
  }

  const { page = 1, limit = 25, offset } = pagination;

  // Use offset if provided, otherwise calculate from page
  const actualOffset = offset ?? (page - 1) * limit;

  return query.range(actualOffset, actualOffset + limit - 1);
}

/**
 * Apply filters to a Supabase query
 */
export function applyFilters<T>(
  query: any,
  filters?: Record<string, any>
) {
  if (!filters || Object.keys(filters).length === 0) {
    return query;
  }

  let filteredQuery = query;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      filteredQuery = filteredQuery.eq(key, value);
    }
  }

  return filteredQuery;
}

/**
 * Build a standard select query with common options
 */
export function buildSelectQuery<T>(
  supabase: SupabaseClient,
  table: string,
  options: {
    select?: string;
    filters?: Record<string, any>;
    sorting?: SortOptions[];
    pagination?: PaginationOptions;
  } = {}
) {
  const { select = '*', filters, sorting, pagination } = options;

  let query = supabase.from(table).select(select, { count: 'exact' });

  query = applyFilters(query, filters);
  query = applySorting(query, sorting);
  query = applyPagination(query, pagination);

  return query;
}
```

### Step 3: Create Entity-Specific Query Types

**File:** `/src/queries/members/types.ts`

```typescript
import { Member } from '@/types';

/**
 * Member with related data (for joins)
 */
export interface MemberWithRelations extends Member {
  member_functions?: MemberFunction[];
  member_payments?: MemberPayment[];
}

/**
 * Member function join data
 */
export interface MemberFunction {
  function_id: string;
  function_name: string;
  start_date: string;
  end_date?: string;
}

/**
 * Member payment join data
 */
export interface MemberPayment {
  amount: number;
  paid_at: string;
  status: 'paid' | 'pending' | 'overdue';
}

/**
 * Options for querying members
 */
export interface GetMembersOptions {
  isInternal?: boolean;
  isExternal?: boolean;
  onLoan?: boolean;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Member filter options
 */
export interface MemberFilters {
  is_internal?: boolean;
  is_external?: boolean;
  on_loan?: boolean;
  is_active?: boolean;
  category_id?: string;
}
```

### Step 4: Create Query Functions

**File:** `/src/queries/members/queries.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Member } from '@/types';
import { QueryResult, SortOptions } from '../shared/types';
import { buildSelectQuery, applySorting } from '../shared/queryBuilder';
import { MemberWithRelations, GetMembersOptions, MemberFilters } from './types';

/**
 * Get all members with optional filtering and sorting
 *
 * @example
 * const result = await getAllMembers(supabase, {
 *   isInternal: true,
 *   page: 1,
 *   limit: 25
 * });
 */
export async function getAllMembers(
  supabase: SupabaseClient,
  options: GetMembersOptions = {}
): Promise<QueryResult<Member[]>> {
  try {
    const {
      isInternal,
      isExternal,
      onLoan,
      activeOnly,
      page = 1,
      limit = 100,
      search,
    } = options;

    // Build base query
    let query = supabase.from('members').select('*', { count: 'exact' });

    // Apply filters
    if (isInternal !== undefined) {
      query = query.eq('is_internal', isInternal);
    }
    if (isExternal !== undefined) {
      query = query.eq('is_external', isExternal);
    }
    if (onLoan !== undefined) {
      query = query.eq('on_loan', onLoan);
    }
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Apply search
    if (search && search.trim().length > 0) {
      query = query.or(
        `name.ilike.%${search}%,surname.ilike.%${search}%,registration_number.ilike.%${search}%`
      );
    }

    // Apply default sorting
    query = query
      .order('surname', { ascending: true })
      .order('name', { ascending: true });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      return {
        data: null,
        error: error.message,
        count: 0,
      };
    }

    return {
      data: data as Member[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in getAllMembers:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}

/**
 * Get internal members only
 *
 * @example
 * const result = await getInternalMembers(supabase);
 */
export async function getInternalMembers(
  supabase: SupabaseClient,
  options: { page?: number; limit?: number } = {}
): Promise<QueryResult<Member[]>> {
  return getAllMembers(supabase, {
    ...options,
    isInternal: true,
  });
}

/**
 * Get external members only
 *
 * @example
 * const result = await getExternalMembers(supabase);
 */
export async function getExternalMembers(
  supabase: SupabaseClient,
  options: { page?: number; limit?: number } = {}
): Promise<QueryResult<Member[]>> {
  return getAllMembers(supabase, {
    ...options,
    isExternal: true,
  });
}

/**
 * Get members on loan
 *
 * @example
 * const result = await getMembersOnLoan(supabase);
 */
export async function getMembersOnLoan(
  supabase: SupabaseClient
): Promise<QueryResult<Member[]>> {
  return getAllMembers(supabase, {
    onLoan: true,
  });
}

/**
 * Get member by ID
 *
 * @example
 * const result = await getMemberById(supabase, '123');
 */
export async function getMemberById(
  supabase: SupabaseClient,
  id: string
): Promise<QueryResult<Member>> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as Member,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getMemberById:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Get member with all related data (functions, payments, etc.)
 *
 * @example
 * const result = await getMemberWithRelations(supabase, '123');
 */
export async function getMemberWithRelations(
  supabase: SupabaseClient,
  id: string
): Promise<QueryResult<MemberWithRelations>> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select(
        `
        *,
        member_functions(
          function_id,
          function_name,
          start_date,
          end_date
        ),
        member_payments(
          amount,
          paid_at,
          status
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching member with relations:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as MemberWithRelations,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in getMemberWithRelations:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Get members by category ID
 *
 * @example
 * const result = await getMembersByCategory(supabase, 'cat-123');
 */
export async function getMembersByCategory(
  supabase: SupabaseClient,
  categoryId: string
): Promise<QueryResult<Member[]>> {
  try {
    const { data, error, count } = await supabase
      .from('members')
      .select('*', { count: 'exact' })
      .eq('category_id', categoryId)
      .order('surname', { ascending: true });

    if (error) {
      console.error('Error fetching members by category:', error);
      return {
        data: null,
        error: error.message,
        count: 0,
      };
    }

    return {
      data: data as Member[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in getMembersByCategory:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
      count: 0,
    };
  }
}
```

### Step 5: Create Mutation Functions

**File:** `/src/queries/members/mutations.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { Member, MemberInsert } from '@/types';
import { QueryResult } from '../shared/types';

/**
 * Create a new member
 *
 * @example
 * const result = await createMember(adminClient, {
 *   name: 'John',
 *   surname: 'Doe',
 *   registration_number: '12345'
 * });
 */
export async function createMember(
  supabase: SupabaseClient,
  data: MemberInsert
): Promise<QueryResult<Member>> {
  try {
    const { data: member, error } = await supabase
      .from('members')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: member as Member,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in createMember:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Update an existing member
 *
 * @example
 * const result = await updateMember(adminClient, '123', {
 *   name: 'Jane'
 * });
 */
export async function updateMember(
  supabase: SupabaseClient,
  id: string,
  data: Partial<MemberInsert>
): Promise<QueryResult<Member>> {
  try {
    const { data: member, error } = await supabase
      .from('members')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: member as Member,
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in updateMember:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Delete a member
 *
 * @example
 * const result = await deleteMember(adminClient, '123');
 */
export async function deleteMember(
  supabase: SupabaseClient,
  id: string
): Promise<QueryResult<{ success: boolean }>> {
  try {
    const { error } = await supabase.from('members').delete().eq('id', id);

    if (error) {
      console.error('Error deleting member:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (err: any) {
    console.error('Exception in deleteMember:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}

/**
 * Bulk create members
 *
 * @example
 * const result = await bulkCreateMembers(adminClient, [
 *   { name: 'John', surname: 'Doe' },
 *   { name: 'Jane', surname: 'Smith' }
 * ]);
 */
export async function bulkCreateMembers(
  supabase: SupabaseClient,
  members: MemberInsert[]
): Promise<QueryResult<Member[]>> {
  try {
    const timestamp = new Date().toISOString();
    const membersWithTimestamp = members.map((m) => ({
      ...m,
      created_at: timestamp,
    }));

    const { data, error } = await supabase
      .from('members')
      .insert(membersWithTimestamp)
      .select();

    if (error) {
      console.error('Error bulk creating members:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as Member[],
      error: null,
      count: data?.length ?? 0,
    };
  } catch (err: any) {
    console.error('Exception in bulkCreateMembers:', err);
    return {
      data: null,
      error: err.message || 'Unknown error',
    };
  }
}
```

### Step 6: Create Index File for Easy Imports

**File:** `/src/queries/members/index.ts`

```typescript
/**
 * Centralized export for all member queries and mutations
 *
 * Import like:
 * import { getAllMembers, createMember } from '@/queries/members';
 */

// Queries (read operations)
export {
  getAllMembers,
  getInternalMembers,
  getExternalMembers,
  getMembersOnLoan,
  getMemberById,
  getMemberWithRelations,
  getMembersByCategory,
} from './queries';

// Mutations (write operations)
export {
  createMember,
  updateMember,
  deleteMember,
  bulkCreateMembers,
} from './mutations';

// Types
export type {
  MemberWithRelations,
  GetMembersOptions,
  MemberFilters,
  MemberFunction,
  MemberPayment,
} from './types';
```

---

## Complete Examples

### Example 1: Using Query Layer in API Routes

**Before (API Route with Inline Query):**

```typescript
// /src/app/api/members/route.ts
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('members')
      .select('*')
      .order('surname', {ascending: true})
      .order('name', {ascending: true});

    if (error) throw error;
    return successResponse(data);
  });
}
```

**After (API Route with Query Layer):**

```typescript
// /src/app/api/members/route.ts
import { getAllMembers } from '@/queries/members';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const result = await getAllMembers(supabase);

    if (result.error) {
      throw new Error(result.error);
    }

    return successResponse(result.data);
  });
}
```

**Benefits:**
- ✅ Query logic centralized
- ✅ Easy to test
- ✅ Type-safe return value
- ✅ Consistent error handling

### Example 2: Internal Members with Filtering

**Before:**

```typescript
// /src/app/api/members/internal/route.ts
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .eq('is_internal', true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,surname.ilike.%${search}%`);
    }

    query = query
      .order('surname', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return successResponse({ data, count });
  });
}
```

**After:**

```typescript
// /src/app/api/members/internal/route.ts
import { getInternalMembers } from '@/queries/members';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';

    const result = await getInternalMembers(supabase, {
      page,
      limit,
      search,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return successResponse({
      data: result.data,
      count: result.count,
    });
  });
}
```

**Benefits:**
- ✅ Much simpler route handler
- ✅ All query logic in one place
- ✅ Options object is self-documenting
- ✅ Easy to add more filters

### Example 3: Create Member Mutation

**Before:**

```typescript
// /src/app/api/members/route.ts
export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: MemberInsert = await request.json();

    const { data, error } = await admin
      .from('members')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return successResponse(data, 201);
  });
}
```

**After:**

```typescript
// /src/app/api/members/route.ts
import { createMember } from '@/queries/members';

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body: MemberInsert = await request.json();

    const result = await createMember(admin, body);

    if (result.error) {
      throw new Error(result.error);
    }

    return successResponse(result.data, 201);
  });
}
```

**Benefits:**
- ✅ Route handler focuses on HTTP concerns
- ✅ Query logic is reusable
- ✅ Timestamps handled automatically
- ✅ Easy to add validation or business logic to the mutation

### Example 4: Complex Query with Joins

**Before:**

```typescript
// Scattered across multiple files or duplicated
const { data, error } = await supabase
  .from('members')
  .select(`
    *,
    member_functions(function_id, function_name),
    member_payments(amount, paid_at, status)
  `)
  .eq('id', memberId)
  .single();
```

**After:**

```typescript
import { getMemberWithRelations } from '@/queries/members';

const result = await getMemberWithRelations(supabase, memberId);
if (result.data) {
  // TypeScript knows about member_functions and member_payments!
  console.log(result.data.member_functions);
  console.log(result.data.member_payments);
}
```

**Benefits:**
- ✅ Complex select statement in one place
- ✅ Type-safe with `MemberWithRelations` interface
- ✅ Reusable across routes and services
- ✅ Easy to optimize or modify

### Example 5: Using in Services

**Before:**

```typescript
// /src/services/memberService.ts
export async function getMemberStats(memberId: string) {
  const supabase = createClient();

  // Inline query
  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single();

  // Calculate stats...
}
```

**After:**

```typescript
// /src/services/memberService.ts
import { getMemberById, getMemberWithRelations } from '@/queries/members';

export async function getMemberStats(memberId: string) {
  const supabase = createClient();

  // Use query layer
  const result = await getMemberWithRelations(supabase, memberId);

  if (result.error || !result.data) {
    throw new Error(result.error || 'Member not found');
  }

  const member = result.data;

  // Calculate stats using member and relations...
  const totalPayments = member.member_payments?.reduce(
    (sum, p) => sum + p.amount,
    0
  ) ?? 0;

  return {
    member,
    totalPayments,
    functionCount: member.member_functions?.length ?? 0,
  };
}
```

---

## Migration Strategy

### Phase 1: Set Up Infrastructure (Week 1)

**Tasks:**
1. Create directory structure
2. Set up shared utilities
3. Create types for one entity (e.g., members)
4. Implement queries for that entity
5. Write tests for queries

**Checklist:**
```
□ Create /src/queries/ directory
□ Create /src/queries/shared/ utilities
□ Create /src/queries/members/ structure
□ Implement getAllMembers, getMemberById
□ Implement createMember, updateMember, deleteMember
□ Write unit tests for queries
□ Update 1-2 API routes to use new queries
□ Verify everything works
```

### Phase 2: Migrate Entity by Entity (Weeks 2-6)

**Priority Order:**
1. **Members** (Most used, 5+ API routes)
2. **Categories** (3+ API routes)
3. **Committees** (2+ API routes)
4. **Seasons** (2+ API routes)
5. **Matches** (Complex queries, high value)
6. **Blog Posts**
7. **Comments**
8. **Teams/Clubs**
9. **Other entities**

**Per Entity Checklist:**
```
□ Create /src/queries/[entity]/ directory
□ Define types in types.ts
□ Implement queries.ts (all SELECT operations)
□ Implement mutations.ts (all INSERT/UPDATE/DELETE)
□ Create index.ts for exports
□ Write tests for all functions
□ Update API routes to use queries
□ Update services to use queries (if any)
□ Test in development
□ Deploy and monitor
```

### Phase 3: Optimize & Refine (Week 7)

**Tasks:**
1. Identify slow queries
2. Add indexes to database
3. Optimize select statements
4. Add caching where appropriate
5. Document performance improvements

### Example Migration: Members Entity

**Step 1: Create Query File**

```bash
mkdir -p src/queries/members
touch src/queries/members/types.ts
touch src/queries/members/queries.ts
touch src/queries/members/mutations.ts
touch src/queries/members/index.ts
```

**Step 2: Implement Queries**

Copy the examples from the [Implementation Guide](#implementation-guide) above.

**Step 3: Update API Routes One by One**

Start with simplest route first:

```typescript
// /src/app/api/members/route.ts
// OLD CODE (comment out, don't delete yet)
// const {data, error} = await supabase.from('members').select('*')...

// NEW CODE
import { getAllMembers } from '@/queries/members';
const result = await getAllMembers(supabase);
```

**Step 4: Test Thoroughly**

```bash
# Run the dev server
npm run dev

# Test the endpoint
curl http://localhost:3000/api/members

# Check for errors in console
```

**Step 5: Update Remaining Routes**

Once you're confident the first route works, update the others:
- `/api/members/internal` → use `getInternalMembers()`
- `/api/members/external` → use `getExternalMembers()`
- `/api/members/on-loan` → use `getMembersOnLoan()`
- `/api/members/[id]` → use `getMemberById()`

**Step 6: Delete Old Code**

After 1-2 weeks of successful operation, remove the commented old code.

---

## Benefits & Trade-offs

### Benefits

| Benefit | Description | Impact |
|---------|-------------|--------|
| **Single Source of Truth** | All queries in one place | High - Easy to find and update |
| **Reusability** | Use same query in routes, services, hooks | High - Reduce code duplication 50%+ |
| **Testability** | Test queries independently | High - Better test coverage |
| **Type Safety** | Explicit return types | Medium - Catch errors at compile time |
| **Maintainability** | Change query once, updates everywhere | High - Faster development |
| **Performance** | Easy to identify and optimize slow queries | Medium - Better monitoring |
| **Documentation** | Self-documenting with JSDoc | Medium - Better DX |
| **Consistency** | All queries follow same patterns | Medium - Easier onboarding |

### Trade-offs

| Trade-off | Mitigation |
|-----------|------------|
| **More files** | Organized by entity, easy to navigate |
| **Extra abstraction** | Better than duplication |
| **Migration effort** | Do gradually, one entity at a time |
| **Learning curve** | Document patterns clearly |

### Code Metrics

**Before Query Layer:**
- 54 API routes × 30 lines of query code = **1,620 lines**
- Duplicated queries across files
- No central place to optimize

**After Query Layer:**
- ~10 entities × 200 lines of query code = **2,000 lines**
- But: Each query reused 3-5 times
- **Effective reduction: 50% less duplication**

---

## Testing Strategy

### Unit Tests for Query Functions

**File:** `/src/queries/members/__tests__/queries.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getAllMembers, getMemberById } from '../queries';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({
            data: [{ id: '1', name: 'John', surname: 'Doe' }],
            error: null,
            count: 1,
          })),
        })),
      })),
    })),
  })),
} as any;

describe('Member Queries', () => {
  it('should fetch all members', async () => {
    const result = await getAllMembers(mockSupabase);

    expect(result.data).toBeDefined();
    expect(result.data?.length).toBe(1);
    expect(result.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const errorSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' },
        })),
      })),
    } as any;

    const result = await getAllMembers(errorSupabase);

    expect(result.data).toBeNull();
    expect(result.error).toBe('Database error');
  });

  it('should apply filters correctly', async () => {
    const result = await getAllMembers(mockSupabase, {
      isInternal: true,
      page: 2,
      limit: 10,
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('members');
  });
});
```

### Integration Tests for API Routes

**File:** `/src/app/api/members/__tests__/route.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

describe('Members API Route', () => {
  it('should return all members', async () => {
    const request = new NextRequest('http://localhost/api/members');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
  });

  it('should create a new member', async () => {
    const request = new NextRequest('http://localhost/api/members', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test',
        surname: 'User',
        registration_number: '12345',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe('Test');
  });
});
```

---

## Best Practices

### 1. Naming Conventions

```typescript
// Query functions (read operations)
getAll[Entity]()          // Get all records
get[Entity]ById()         // Get single record by ID
get[Entity]By[Field]()    // Get records by specific field
get[Entity]With[Related]() // Get with joined data

// Mutation functions (write operations)
create[Entity]()          // Create new record
update[Entity]()          // Update existing record
delete[Entity]()          // Delete record
bulkCreate[Entity]()      // Bulk insert
```

### 2. Error Handling

Always return `QueryResult<T>` with consistent structure:

```typescript
// Success
return {
  data: results,
  error: null,
  count: results.length,
};

// Error
return {
  data: null,
  error: error.message,
  count: 0,
};
```

### 3. Type Safety

Define explicit return types:

```typescript
// ✅ Good: Explicit return type
export async function getAllMembers(
  supabase: SupabaseClient,
  options?: GetMembersOptions
): Promise<QueryResult<Member[]>> {
  // ...
}

// ❌ Bad: No return type
export async function getAllMembers(supabase, options) {
  // ...
}
```

### 4. Documentation

Add JSDoc comments with examples:

```typescript
/**
 * Get all members with optional filtering
 *
 * @param supabase - Supabase client instance
 * @param options - Filtering and pagination options
 * @returns Promise with member array and metadata
 *
 * @example
 * const result = await getAllMembers(supabase, {
 *   isInternal: true,
 *   page: 1,
 *   limit: 25
 * });
 */
```

### 5. Performance Optimization

```typescript
// Use select() to fetch only needed fields
.select('id, name, surname')  // Instead of .select('*')

// Use proper indexes
// Add in database: CREATE INDEX idx_members_surname ON members(surname);

// Use pagination
.range(offset, offset + limit - 1)

// Use count only when needed
.select('*', { count: 'exact' })  // count: 'exact' has overhead
```

### 6. Reusability

Build composable queries:

```typescript
// Base query
export async function getAllMembers(
  supabase: SupabaseClient,
  options: GetMembersOptions
): Promise<QueryResult<Member[]>> {
  // Full implementation
}

// Specialized queries use the base
export async function getInternalMembers(
  supabase: SupabaseClient,
  options?: Partial<GetMembersOptions>
): Promise<QueryResult<Member[]>> {
  return getAllMembers(supabase, {
    ...options,
    isInternal: true,  // Override with specific filter
  });
}
```

---

## Summary

### What We've Learned

1. **Query Layer** = Centralized place for all database queries
2. **Benefits**: Reusability, testability, maintainability, type safety
3. **Structure**: Organized by entity (members/, categories/, etc.)
4. **Files**: `queries.ts` (read), `mutations.ts` (write), `types.ts`, `index.ts`
5. **Migration**: Do gradually, entity by entity
6. **Testing**: Unit test queries, integration test routes

### Quick Start Checklist

```
□ Create /src/queries/shared/ utilities
□ Pick first entity (e.g., members)
□ Create /src/queries/members/ structure
□ Implement getAllMembers() function
□ Update /api/members/route.ts to use it
□ Test thoroughly
□ Repeat for other entities
```

### Next Steps

1. **Start with members entity** - Most used, highest impact
2. **Create query functions** - Follow examples above
3. **Update 1-2 API routes** - Verify it works
4. **Expand to other entities** - One per week
5. **Optimize** - Add caching, indexes, etc.

---

## Additional Resources

- [CODEBASE_ARCHITECTURE_ANALYSIS.md](./CODEBASE_ARCHITECTURE_ANALYSIS.md) - Overall architecture
- [DYNAMIC_ROUTE_CONSOLIDATION_GUIDE.md](./DYNAMIC_ROUTE_CONSOLIDATION_GUIDE.md) - API route patterns
- [Supabase Query Documentation](https://supabase.com/docs/reference/javascript/select)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html) - Similar concept

---

**Last Updated:** November 13, 2025
**Version:** 1.0
**Status:** Ready for Implementation