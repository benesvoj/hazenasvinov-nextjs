# Dynamic Route Consolidation Pattern
## Reducing Code Duplication in API Routes

## Table of Contents
1. [Current Problem](#current-problem)
2. [What are Dynamic Routes?](#what-are-dynamic-routes)
3. [The Consolidation Pattern](#the-consolidation-pattern)
4. [Implementation Guide](#implementation-guide)
5. [Benefits & Trade-offs](#benefits--trade-offs)
6. [Migration Strategy](#migration-strategy)

---

## Current Problem

### Current Architecture (54 separate route files)

```
/src/app/api/
├── members/
│   └── route.ts          ← GET all members, POST create member
├── categories/
│   └── route.ts          ← GET all categories, POST create category
├── blog/
│   └── route.ts          ← GET all posts, POST create post
├── seasons/
│   └── route.ts          ← GET all seasons, POST create season
└── ... (50+ more similar routes)
```

### The Duplication Problem

Each route file has **nearly identical code structure**:

**`/api/members/route.ts`:**
```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('members')              // ← Only difference: table name
      .select('*')
      .order('surname', {ascending: true});

    if (error) throw error;
    return successResponse(data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const {data, error} = await admin
      .from('members')              // ← Only difference: table name
      .insert({...body})
      .select()
      .single();

    if (error) throw error;
    return successResponse(data, 201);
  });
}
```

**`/api/categories/route.ts`:**
```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('categories')           // ← Only difference: table name
      .select('*')
      .order('name', {ascending: true});

    if (error) throw error;
    return successResponse(data);
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const {data, error} = await admin
      .from('categories')           // ← Only difference: table name
      .insert({...body})
      .select()
      .single();

    if (error) throw error;
    return successResponse(data, 201);
  });
}
```

**Result:** 54 files with 90% identical code, only differing in:
- Table name
- Sort order
- Minor filtering logic

---

## What are Dynamic Routes?

Next.js allows you to create dynamic route segments using **square brackets** `[param]`:

### Example: Dynamic Segments

```
File: /src/app/api/users/[id]/route.ts
URL:  /api/users/123
      /api/users/456

The [id] becomes a parameter you can access in your handler.
```

### In Your Handler:

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(params.id); // "123" or "456"
  // Fetch user with this ID
}
```

### Multiple Dynamic Segments:

```
File: /src/app/api/[entity]/[id]/route.ts
URL:  /api/members/123
      /api/categories/456

params = { entity: "members", id: "123" }
params = { entity: "categories", id: "456" }
```

---

## The Consolidation Pattern

### New Architecture (2 dynamic route files)

```
/src/app/api/
└── entities/
    ├── [entity]/
    │   ├── route.ts              ← Handles GET all, POST create for ANY entity
    │   └── [id]/
    │       └── route.ts          ← Handles GET, PUT, DELETE by ID for ANY entity
    └── config.ts                 ← Entity configuration registry
```

### How It Works

**1. Configuration Registry** (`/api/entities/config.ts`):

```typescript
// Define what each entity should do
export interface EntityConfig {
  tableName: string;
  sortBy?: { column: string; ascending: boolean }[];
  requiresAdmin?: boolean;
  customQuery?: (supabase: SupabaseClient) => any;
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  // Members configuration
  members: {
    tableName: 'members',
    sortBy: [
      { column: 'surname', ascending: true },
      { column: 'name', ascending: true }
    ],
    requiresAdmin: true,
  },

  // Categories configuration
  categories: {
    tableName: 'categories',
    sortBy: [
      { column: 'sort_order', ascending: true },
      { column: 'name', ascending: true }
    ],
    requiresAdmin: true,
  },

  // Blog posts configuration
  blog: {
    tableName: 'blog_posts',
    sortBy: [
      { column: 'created_at', ascending: false }
    ],
    requiresAdmin: false, // Public read access
  },

  // Seasons configuration
  seasons: {
    tableName: 'seasons',
    sortBy: [
      { column: 'start_date', ascending: false }
    ],
    requiresAdmin: true,
  },

  // ... Add all 54 entities here
};
```

**2. Dynamic Route Handler** (`/api/entities/[entity]/route.ts`):

```typescript
import { NextRequest } from 'next/server';
import { successResponse, withAuth, withAdminAuth, errorResponse } from '@/utils/supabase/apiHelpers';
import { ENTITY_CONFIGS } from '../config';

/**
 * GET /api/entities/[entity]
 *
 * Examples:
 * - GET /api/entities/members
 * - GET /api/entities/categories
 * - GET /api/entities/blog
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const {entity} = await params;

  // 1. Lookup entity configuration
  const config = ENTITY_CONFIGS[entity];
  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  // 2. Use appropriate auth wrapper
  return withAuth(async (user, supabase) => {
    // 3. Build query dynamically
    let query = supabase.from(config.tableName).select('*');

    // 4. Apply sorting from config
    if (config.sortBy) {
      config.sortBy.forEach(sort => {
        query = query.order(sort.column, { ascending: sort.ascending });
      });
    }

    // 5. Execute query
    const { data, error } = await query;
    if (error) throw error;

    return successResponse(data);
  });
}

/**
 * POST /api/entities/[entity]
 *
 * Examples:
 * - POST /api/entities/members
 * - POST /api/entities/categories
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const {entity} = await params;

  // 1. Lookup entity configuration
  const config = ENTITY_CONFIGS[entity];
  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  // 2. Use admin auth for creation
  return withAdminAuth(async (user, supabase, admin) => {
    // 3. Parse request body
    const body = await request.json();

    // 4. Insert into the configured table
    const { data, error } = await admin
      .from(config.tableName)
      .insert({ ...body })
      .select()
      .single();

    if (error) throw error;

    return successResponse(data, 201);
  });
}
```

**3. Dynamic ID Route Handler** (`/api/entities/[entity]/[id]/route.ts`):

```typescript
import { NextRequest } from 'next/server';
import { successResponse, withAuth, withAdminAuth, errorResponse } from '@/utils/supabase/apiHelpers';
import { ENTITY_CONFIGS } from '../../config';

/**
 * GET /api/entities/[entity]/[id]
 *
 * Examples:
 * - GET /api/entities/members/123
 * - GET /api/entities/categories/456
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await params;
  const config = ENTITY_CONFIGS[entity];

  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAuth(async (user, supabase) => {
    const { data, error } = await supabase
      .from(config.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return errorResponse(`${entity} not found`, 404);
    }

    return successResponse(data);
  });
}

/**
 * PUT /api/entities/[entity]/[id]
 *
 * Examples:
 * - PUT /api/entities/members/123
 * - PUT /api/entities/categories/456
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await params;
  const config = ENTITY_CONFIGS[entity];

  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();

    const { data, error } = await admin
      .from(config.tableName)
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  });
}

/**
 * DELETE /api/entities/[entity]/[id]
 *
 * Examples:
 * - DELETE /api/entities/members/123
 * - DELETE /api/entities/categories/456
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> }
) {
  const { entity, id } = await params;
  const config = ENTITY_CONFIGS[entity];

  if (!config) {
    return errorResponse(`Entity '${entity}' not found`, 404);
  }

  return withAdminAuth(async (user, supabase, admin) => {
    const { error } = await admin
      .from(config.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;

    return successResponse({ success: true });
  });
}
```

---

## Implementation Guide

### Step 1: Create Entity Configuration

Create `/src/app/api/entities/config.ts`:

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export interface EntityConfig {
  tableName: string;
  sortBy?: { column: string; ascending: boolean }[];
  requiresAdmin?: boolean;
  validateCreate?: (body: any) => { valid: boolean; errors?: string[] };
  validateUpdate?: (body: any) => { valid: boolean; errors?: string[] };
  customQuery?: (supabase: SupabaseClient, params: any) => any;
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  members: {
    tableName: 'members',
    sortBy: [
      { column: 'surname', ascending: true },
      { column: 'name', ascending: true }
    ],
    requiresAdmin: true,
  },

  categories: {
    tableName: 'categories',
    sortBy: [
      { column: 'sort_order', ascending: true },
      { column: 'name', ascending: true }
    ],
    requiresAdmin: true,
  },

  // Add more entities...
};

// Helper function to get entity config
export function getEntityConfig(entity: string): EntityConfig | null {
  return ENTITY_CONFIGS[entity] || null;
}

// Helper to validate entity exists
export function isValidEntity(entity: string): boolean {
  return entity in ENTITY_CONFIGS;
}
```

### Step 2: Create Dynamic Route Handlers

Create the file structure:
```
/src/app/api/entities/
├── config.ts
├── [entity]/
│   ├── route.ts
│   └── [id]/
│       └── route.ts
```

(Use the implementations from the previous section)

### Step 3: Update API Routes Constants

Update `/src/lib/api-routes.ts`:

```typescript
export const API_ROUTES = {
  // New dynamic routes
  entities: {
    root: (entity: string) => `/api/entities/${entity}`,
    byId: (entity: string, id: string) => `/api/entities/${entity}/${id}`,
  },

  // Keep existing routes for backward compatibility during migration
  members: {
    root: '/api/members',
    byId: (id: string) => `/api/members/${id}`,
    // ... other routes
  },

  categories: {
    root: '/api/categories',
    byId: (id: string) => `/api/categories/${id}`,
  },

  // ...
};
```

### Step 4: Update Hooks to Use New Routes (Gradually)

Example migration of `useFetchMembers`:

```typescript
// Before:
const res = await fetch(API_ROUTES.members.root);

// After:
const res = await fetch(API_ROUTES.entities.root('members'));

// Or keep using the old route during transition:
const res = await fetch(API_ROUTES.members.root); // Still works!
```

---

## Benefits & Trade-offs

### ✅ Benefits

| Benefit | Description |
|---------|-------------|
| **Code Reduction** | 54 route files → 3 files (95% reduction) |
| **Consistency** | All entities use identical logic |
| **Maintainability** | One place to fix bugs/add features |
| **Type Safety** | Configuration is type-checked |
| **Easy to Add Entities** | Just add to config, no new files |
| **Testing** | Test one route handler, covers all entities |
| **Bulk Operations** | Easier to add features like batch updates |

### ⚠️ Trade-offs

| Trade-off | Mitigation |
|-----------|------------|
| **Less Obvious** | Developers need to check config to understand behavior | Good documentation & comments |
| **Custom Logic Harder** | Entities with unique behavior need special handling | Use `customQuery` option in config |
| **Debugging** | Stack traces show generic handler | Add entity name to error logs |
| **Migration Effort** | Need to migrate 54 routes and all hooks | Do gradually, support both patterns |

### When NOT to Use Dynamic Routes

Keep separate route files for entities that have:
1. **Complex custom logic** that doesn't fit the pattern
2. **Many custom endpoints** beyond basic CRUD
3. **Special authentication requirements**
4. **Performance-critical queries** requiring optimization

Examples in your codebase:
- `/api/members/internal` - Custom filtering logic
- `/api/members/external` - Different data structure
- `/api/matches/*` - Complex queries with joins

---

## Advanced Configuration Examples

### Example 1: Custom Query Logic

```typescript
const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  members: {
    tableName: 'members',
    sortBy: [{ column: 'surname', ascending: true }],
    requiresAdmin: true,
    // Custom query function
    customQuery: (supabase, params) => {
      let query = supabase.from('members').select(`
        *,
        member_functions(function_id, function_name),
        member_payments(amount, paid_at)
      `);

      // Apply custom filters
      if (params.activeOnly) {
        query = query.eq('is_active', true);
      }

      return query;
    },
  },
};
```

### Example 2: Validation

```typescript
const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  categories: {
    tableName: 'categories',
    requiresAdmin: true,
    validateCreate: (body) => {
      const errors: string[] = [];

      if (!body.name || body.name.trim().length === 0) {
        errors.push('Name is required');
      }

      if (body.sort_order !== undefined && typeof body.sort_order !== 'number') {
        errors.push('Sort order must be a number');
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    },
  },
};
```

Then use it in the route handler:

```typescript
export async function POST(request: NextRequest, { params }: { params: { entity: string } }) {
  const config = ENTITY_CONFIGS[params.entity];
  const body = await request.json();

  // Validate if config provides validation
  if (config.validateCreate) {
    const validation = config.validateCreate(body);
    if (!validation.valid) {
      return errorResponse(`Validation failed: ${validation.errors?.join(', ')}`, 400);
    }
  }

  // Proceed with creation...
}
```

### Example 3: Query Parameters & Filtering

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { entity: string } }
) {
  const config = ENTITY_CONFIGS[params.entity];
  const { searchParams } = new URL(request.url);

  return withAuth(async (user, supabase) => {
    // Use custom query if provided
    if (config.customQuery) {
      const queryParams = {
        activeOnly: searchParams.get('active') === 'true',
        search: searchParams.get('search') || '',
        categoryId: searchParams.get('categoryId') || '',
      };

      const query = config.customQuery(supabase, queryParams);
      const { data, error } = await query;
      if (error) throw error;
      return successResponse(data);
    }

    // Default query logic...
  });
}
```

---

## Migration Strategy

### Phase 1: Set Up Infrastructure (Week 1)
1. ✅ Create `/src/app/api/entities/config.ts`
2. ✅ Create `/src/app/api/entities/[entity]/route.ts`
3. ✅ Create `/src/app/api/entities/[entity]/[id]/route.ts`
4. ✅ Add 5-10 simple entities to config (e.g., categories, seasons)
5. ✅ Test new routes work alongside old routes

### Phase 2: Gradual Migration (Weeks 2-4)
1. ✅ Keep BOTH old and new routes running
2. ✅ Migrate hooks one entity at a time
3. ✅ Run tests after each migration
4. ✅ Monitor for errors in production

**Migration Checklist per Entity:**
```
□ Add entity to ENTITY_CONFIGS
□ Test GET /api/entities/{entity}
□ Test POST /api/entities/{entity}
□ Test GET /api/entities/{entity}/{id}
□ Test PUT /api/entities/{entity}/{id}
□ Test DELETE /api/entities/{entity}/{id}
□ Update hooks to use new route
□ Update API_ROUTES constants
□ Run integration tests
□ Deploy and monitor
□ Remove old route file (after 1-2 weeks)
```

### Phase 3: Complex Entities (Weeks 5-6)
1. ✅ Migrate entities with custom logic
2. ✅ Use `customQuery` config option
3. ✅ Keep special endpoints (like `/api/members/internal`) separate

### Phase 4: Cleanup (Week 7)
1. ✅ Remove old route files
2. ✅ Update documentation
3. ✅ Remove compatibility shims from API_ROUTES

---

## Testing

### Unit Tests

```typescript
// __tests__/api/entities/config.test.ts
import { ENTITY_CONFIGS, isValidEntity, getEntityConfig } from '../config';

describe('Entity Configuration', () => {
  test('should have members config', () => {
    expect(isValidEntity('members')).toBe(true);
    expect(getEntityConfig('members')).toBeDefined();
    expect(getEntityConfig('members')?.tableName).toBe('members');
  });

  test('should reject invalid entity', () => {
    expect(isValidEntity('invalid_entity')).toBe(false);
    expect(getEntityConfig('invalid_entity')).toBeNull();
  });
});
```

### Integration Tests

```typescript
// __tests__/api/entities/[entity]/route.test.ts
import { GET, POST } from '@/app/api/entities/[entity]/route';

describe('Dynamic Entity Routes', () => {
  test('GET /api/entities/members should return members', async () => {
    const request = new NextRequest('http://localhost/api/entities/members');
    const params = { entity: 'members' };

    const response = await GET(request, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toBeDefined();
  });

  test('GET /api/entities/invalid should return 404', async () => {
    const request = new NextRequest('http://localhost/api/entities/invalid');
    const params = { entity: 'invalid' };

    const response = await GET(request, { params });

    expect(response.status).toBe(404);
  });
});
```

---

## Example: Before & After Comparison

### Before (3 files, ~120 lines)

**`/api/members/route.ts` (40 lines):**
```typescript
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

export async function POST(request: NextRequest) {
  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const {data, error} = await admin
      .from('members')
      .insert({...body})
      .select()
      .single();
    if (error) throw error;
    return successResponse(data, 201);
  });
}
```

**`/api/categories/route.ts` (40 lines):**
```typescript
// Nearly identical code...
```

**`/api/blog/route.ts` (40 lines):**
```typescript
// Nearly identical code...
```

### After (2 files, ~150 lines total handles ALL entities)

**`/api/entities/config.ts` (30 lines):**
```typescript
export const ENTITY_CONFIGS = {
  members: {
    tableName: 'members',
    sortBy: [{ column: 'surname', ascending: true }],
  },
  categories: {
    tableName: 'categories',
    sortBy: [{ column: 'name', ascending: true }],
  },
  blog: {
    tableName: 'blog_posts',
    sortBy: [{ column: 'created_at', ascending: false }],
  },
  // ... 51 more entities (1-3 lines each)
};
```

**`/api/entities/[entity]/route.ts` (60 lines, handles all entities):**
```typescript
export async function GET(request: NextRequest, { params }) {
  const config = ENTITY_CONFIGS[params.entity];
  if (!config) return errorResponse('Not found', 404);

  return withAuth(async (user, supabase) => {
    let query = supabase.from(config.tableName).select('*');
    config.sortBy?.forEach(sort => {
      query = query.order(sort.column, { ascending: sort.ascending });
    });
    const {data, error} = await query;
    if (error) throw error;
    return successResponse(data);
  });
}

export async function POST(request: NextRequest, { params }) {
  const config = ENTITY_CONFIGS[params.entity];
  if (!config) return errorResponse('Not found', 404);

  return withAdminAuth(async (user, supabase, admin) => {
    const body = await request.json();
    const {data, error} = await admin
      .from(config.tableName)
      .insert({...body})
      .select()
      .single();
    if (error) throw error;
    return successResponse(data, 201);
  });
}
```

**Result:**
- Before: 54 files × ~40 lines = **~2,160 lines**
- After: 2 files × ~80 lines = **~160 lines** + config (~200 lines) = **~360 lines total**
- **Reduction: 83% fewer lines of code**

---

## Conclusion

The dynamic route consolidation pattern is a powerful way to reduce code duplication while maintaining flexibility. It's particularly useful for applications with many similar CRUD endpoints.

**Key Takeaways:**
1. Use dynamic routes `[entity]` to handle multiple entities with one handler
2. Create a configuration registry for entity-specific behavior
3. Migrate gradually to minimize risk
4. Keep complex/custom endpoints as separate route files
5. Test thoroughly during migration

**Next Steps:**
1. Review the implementation examples
2. Start with 5-10 simple entities
3. Test the new routes
4. Gradually migrate hooks and components
5. Monitor and adjust based on feedback

---

## References

- [Next.js Dynamic Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [API Routes Best Practices](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [CODEBASE_ARCHITECTURE_ANALYSIS.md](./CODEBASE_ARCHITECTURE_ANALYSIS.md) - Section 8.2