# Dynamic Routes Query Layer Integration Plan

## Current Situation Analysis

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  useFetchCommittees hook                                     │
│  → API_ROUTES.entities.root('committees')                    │
│  → GET /api/entities/committees                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Dynamic Entity Routes                       │
│  /api/entities/[entity]/route.ts                             │
│  /api/entities/[entity]/[id]/route.ts                        │
│                                                              │
│  CURRENT: Direct Supabase queries                            │
│  - No query layer                                            │
│  - No pagination support                                     │
│  - No QueryContext pattern                                   │
│  - Configuration-based via ENTITY_CONFIGS                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Old Committee Routes                       │
│  /api/committees/route.ts ✅                                 │
│  /api/committees/[id]/route.ts ✅                            │
│                                                              │
│  REFACTORED: Uses query layer                                │
│  ✅ QueryContext pattern                                     │
│  ✅ Pagination support (?page=1&limit=25)                    │
│  ✅ Query builder utilities                                  │
│  ✅ Clean separation of concerns                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Query Layer                              │
│  src/queries/committees/                                     │
│  - queries.ts (getAllCommittees, getCommitteeById)           │
│  - mutations.ts (create, update, delete)                     │
│  - types.ts (GetCommitteesOptions)                           │
│                                                              │
│  src/queries/shared/                                         │
│  - queryBuilder.ts (buildSelectQuery, etc.)                  │
│  - types.ts (QueryContext, QueryResult)                      │
└─────────────────────────────────────────────────────────────┘
```

### Problem Statement

**Conflict**: We have two API systems for committees:

1. **Old routes** (`/api/committees/*`) - Refactored with query layer ✅
2. **Dynamic routes** (`/api/entities/committees/*`) - Used by hooks, but no query layer ❌

**Goal**: Apply query layer improvements to dynamic routes while maintaining their generic nature.

---

## Gap Analysis

### What Dynamic Routes Are Missing

| Feature | Old Routes | Dynamic Routes | Priority |
|---------|-----------|----------------|----------|
| Query Layer | ✅ | ❌ | HIGH |
| QueryContext Pattern | ✅ | ❌ | HIGH |
| Pagination Support | ✅ | ❌ | HIGH |
| Query Builders | ✅ | ❌ | HIGH |
| Filtering | ❌ | ❌ | MEDIUM |
| Type Safety | ✅ | Partial | MEDIUM |
| Error Handling | Standard | Standard | LOW |

### Current Dynamic Route Implementation

**Pros:**
- ✅ Generic - works for any entity
- ✅ Configuration-based (ENTITY_CONFIGS)
- ✅ Clean structure
- ✅ Easy to add new entities

**Cons:**
- ❌ Direct Supabase queries (no abstraction)
- ❌ No pagination
- ❌ No query layer integration
- ❌ Harder to add complex features per entity
- ❌ Not using shared query builders

---

## Migration Strategy

### Approach Options

#### Option 1: Direct Integration (Recommended)
**Integrate query layer into dynamic routes dynamically**

**Pros:**
- Maintains generic nature of dynamic routes
- Leverages existing query layer
- Keeps configuration-based approach
- Single source of truth for entity operations

**Cons:**
- Requires dynamic imports or registry pattern
- More complex implementation initially

#### Option 2: Parallel Migration
**Keep both routes, gradually migrate entities**

**Pros:**
- Low risk
- Can test incrementally
- Easy rollback

**Cons:**
- Duplicate routes temporarily
- Need to manage both systems
- Frontend needs to know which route to use

#### Option 3: Deprecate Dynamic Routes
**Remove dynamic routes, use entity-specific routes**

**Pros:**
- Simple - just use refactored routes
- More control per entity

**Cons:**
- Loses generic benefits
- Need separate route files for each entity
- More boilerplate

---

## Recommended Implementation Plan

### Phase 1: Enhance Entity Configuration

**Add query layer functions to ENTITY_CONFIGS**

```typescript
// src/app/api/entities/config.ts

import { QueryContext, QueryResult, GetCommitteesOptions } from '@/queries/shared/types';
import * as committeeQueries from '@/queries/committees';
import * as memberQueries from '@/queries/members';

export interface EntityQueryLayer<T = any, Options = any> {
	getAll: (ctx: QueryContext, options?: Options) => Promise<QueryResult<T[]>>;
	getById: (ctx: QueryContext, id: string) => Promise<QueryResult<T>>;
	create: (ctx: QueryContext, data: any) => Promise<QueryResult<T>>;
	update: (ctx: QueryContext, id: string, data: any) => Promise<QueryResult<T>>;
	delete: (ctx: QueryContext, id: string) => Promise<QueryResult<{ success: boolean }>>;
}

export interface EntityConfig {
	tableName: string;
	sortBy?: { column: string; ascending: boolean }[];
	requiresAdmin?: boolean;

	// NEW: Query layer functions
	queryLayer?: EntityQueryLayer;

	// NEW: Support pagination options
	pagination?: {
		defaultLimit: number;
		maxLimit: number;
	};
}

export const ENTITY_CONFIGS: Record<string, EntityConfig> = {
	committees: {
		tableName: 'committees',
		sortBy: [{ column: 'sort_order', ascending: true }],
		requiresAdmin: false,

		// NEW: Use query layer
		queryLayer: {
			getAll: committeeQueries.getAllCommittees,
			getById: committeeQueries.getCommitteeById,
			create: committeeQueries.createCommittee,
			update: committeeQueries.updateCommittee,
			delete: committeeQueries.deleteCommittee,
		},

		pagination: {
			defaultLimit: 25,
			maxLimit: 100,
		},
	},

	// members: { ... },
	// seasons: { ... },
};
```

### Phase 2: Update Dynamic Routes

**Refactor `/api/entities/[entity]/route.ts`**

```typescript
import { NextRequest } from 'next/server';
import { successResponse, withAuth, withAdminAuth, errorResponse } from '@/utils/supabase/apiHelpers';
import { ENTITY_CONFIGS } from '../config';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ entity: string }> }
) {
	const { entity } = await params;
	const config = ENTITY_CONFIGS[entity];

	if (!config) {
		return errorResponse(`Entity '${entity}' not found`, 404);
	}

	return withAuth(async (user, supabase) => {
		// NEW: Use query layer if available
		if (config.queryLayer) {
			// Parse pagination params
			const searchParams = request.nextUrl.searchParams;
			const page = searchParams.get('page');
			const limit = searchParams.get('limit');

			const options = {
				pagination: page || limit ? {
					page: page ? parseInt(page) : 1,
					limit: limit
						? Math.min(parseInt(limit), config.pagination?.maxLimit || 100)
						: config.pagination?.defaultLimit || 25
				} : undefined
			};

			const result = await config.queryLayer.getAll({ supabase }, options);

			if (result.error) {
				throw new Error(result.error);
			}

			return successResponse(result.data);
		}

		// FALLBACK: Legacy direct query for entities without query layer
		let query = supabase.from(config.tableName).select('*');

		if (config.sortBy) {
			config.sortBy.forEach(sort => {
				query = query.order(sort.column, { ascending: sort.ascending });
			});
		}

		const { data, error } = await query;
		if (error) throw error;

		return successResponse(data);
	});
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ entity: string }> }
) {
	const { entity } = await params;
	const config = ENTITY_CONFIGS[entity];

	if (!config) {
		return errorResponse(`Entity '${entity}' not found`, 404);
	}

	return withAdminAuth(async (user, supabase, admin) => {
		const body = await request.json();

		// NEW: Use query layer if available
		if (config.queryLayer) {
			const result = await config.queryLayer.create({ supabase: admin }, body);

			if (result.error) {
				throw new Error(result.error);
			}

			return successResponse(result.data, 201);
		}

		// FALLBACK: Legacy direct query
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

**Similar updates for `/api/entities/[entity]/[id]/route.ts`**

### Phase 3: Gradual Entity Migration

**Priority Order:**
1. ✅ **committees** - Already has query layer
2. 🔄 **members** - Partially done, needs completion
3. ⏳ **seasons** - Next priority
4. ⏳ **categories** - After seasons
5. ⏳ **todos** - Lower priority
6. ⏳ **blog** - Lower priority

**For each entity:**
1. Create query layer (`src/queries/{entity}/`)
2. Add to `ENTITY_CONFIGS` with `queryLayer`
3. Test dynamic routes with query layer
4. Deprecate old dedicated route (optional)

### Phase 4: Deprecation Strategy

**Once all entities migrated:**

1. **Update Frontend**
   - All hooks use dynamic routes ✅ (already done for committees)

2. **Deprecate Old Routes**
   - Add deprecation warnings to old routes
   - Monitor usage
   - Remove after grace period

3. **Cleanup**
   - Remove `/api/committees/*` route files
   - Remove `/api/seasons/*` route files
   - Keep only dynamic routes

---

## Implementation Checklist

### Immediate Actions (Phase 1)
- [ ] Update `ENTITY_CONFIGS` interface to include `queryLayer` and `pagination`
- [ ] Add committees query layer to config
- [ ] Add members query layer to config (complete if needed)

### Short Term (Phase 2)
- [ ] Refactor `/api/entities/[entity]/route.ts` GET handler
- [ ] Refactor `/api/entities/[entity]/route.ts` POST handler
- [ ] Refactor `/api/entities/[entity]/[id]/route.ts` GET handler
- [ ] Refactor `/api/entities/[entity]/[id]/route.ts` PATCH/PUT handlers
- [ ] Refactor `/api/entities/[entity]/[id]/route.ts` DELETE handler
- [ ] Add pagination query param parsing
- [ ] Add pagination response metadata (count, page info)
- [ ] Test committees via dynamic routes

### Medium Term (Phase 3)
- [ ] Complete members query layer
- [ ] Create seasons query layer
- [ ] Create categories query layer
- [ ] Create todos query layer
- [ ] Create blog query layer
- [ ] Update hooks to use pagination if needed

### Long Term (Phase 4)
- [ ] Add deprecation notices to old routes
- [ ] Monitor usage of old routes
- [ ] Remove old route files
- [ ] Update documentation
- [ ] Update API route generator script

---

## Testing Strategy

### Test Cases Per Entity

1. **GET /api/entities/{entity}**
   - ✅ Returns all records with default sorting
   - ✅ Supports pagination (?page=1&limit=10)
   - ✅ Respects max limit
   - ✅ Returns count metadata
   - ✅ Auth protection works

2. **GET /api/entities/{entity}/{id}**
   - ✅ Returns single record
   - ✅ Returns 404 for non-existent ID
   - ✅ Auth protection works

3. **POST /api/entities/{entity}**
   - ✅ Creates new record
   - ✅ Returns created record
   - ✅ Admin auth required
   - ✅ Validation works

4. **PATCH /api/entities/{entity}/{id}**
   - ✅ Updates record
   - ✅ Partial update works
   - ✅ Admin auth required
   - ✅ Returns 404 for non-existent ID

5. **DELETE /api/entities/{entity}/{id}**
   - ✅ Deletes record
   - ✅ Returns success
   - ✅ Admin auth required
   - ✅ Returns 404 for non-existent ID

### Regression Testing

- [ ] All existing hooks continue to work
- [ ] Frontend pagination works (if implemented)
- [ ] Performance is not degraded
- [ ] Error handling is consistent

---

## Benefits After Migration

### For Developers
✅ Consistent patterns across all entities
✅ Easier to add new features globally
✅ Better type safety
✅ Reduced boilerplate
✅ Single source of truth for queries

### For Users
✅ Pagination support for large datasets
✅ Better performance
✅ More consistent API behavior
✅ Easier filtering/sorting (future)

### For Maintenance
✅ Centralized query logic
✅ Easier to debug
✅ Better test coverage
✅ Clearer separation of concerns

---

## Migration Timeline Estimate

| Phase | Tasks | Estimated Time | Status |
|-------|-------|---------------|--------|
| Phase 1 | Update config structure | 2-4 hours | 📋 Planned |
| Phase 2 | Refactor dynamic routes | 4-6 hours | 📋 Planned |
| Phase 3 | Migrate entities (5 entities) | 10-15 hours | 🔄 Partial |
| Phase 4 | Deprecation & cleanup | 2-3 hours | ⏳ Pending |
| **TOTAL** | | **18-28 hours** | |

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking existing hooks | HIGH | LOW | Maintain fallback to direct queries |
| Performance regression | MEDIUM | LOW | Add query optimization, caching |
| Complex entity logic doesn't fit | MEDIUM | MEDIUM | Allow custom query functions in config |
| Migration takes too long | LOW | MEDIUM | Prioritize critical entities first |

---

## Next Steps

1. **Review this plan** with team
2. **Start Phase 1** - Update config structure
3. **Test with committees** - Validate approach
4. **Create entity migration template** - Standardize process
5. **Execute Phase 2** - Refactor dynamic routes
6. **Migrate remaining entities** - One by one

---

## Open Questions

1. Should we keep old routes as fallback during migration?
2. Do we need pagination metadata in response (total pages, etc.)?
3. Should we add filtering support immediately or defer?
4. How to handle entity-specific query options (each entity might need different filters)?
5. Should pagination be mandatory or optional per entity?

---

**Document Status**: Draft
**Created**: 2025-11-13
**Author**: Claude Code
**Last Updated**: 2025-11-13