# Dynamic Routes Query Layer Migration - Executive Summary

## The Problem

**Two API systems for the same entities:**

```
❌ Current State:
  Committees Hook → /api/entities/committees (No query layer, no pagination)
  Old Route → /api/committees (Has query layer ✅, pagination ✅)

✅ Desired State:
  Committees Hook → /api/entities/committees (With query layer, pagination)
  Old Route → Deprecated/Removed
```

## The Solution

**Enhance ENTITY_CONFIGS to support query layer functions**

### Step 1: Add Query Layer to Config

```typescript
// src/app/api/entities/config.ts
import * as committeeQueries from '@/queries/committees';

export const ENTITY_CONFIGS = {
	committees: {
		tableName: 'committees',
		sortBy: [{ column: 'sort_order', ascending: true }],

		// NEW: Query layer functions
		queryLayer: {
			getAll: committeeQueries.getAllCommittees,
			getById: committeeQueries.getCommitteeById,
			create: committeeQueries.createCommittee,
			update: committeeQueries.updateCommittee,
			delete: committeeQueries.deleteCommittee,
		},

		// NEW: Pagination config
		pagination: {
			defaultLimit: 25,
			maxLimit: 100,
		},
	},
};
```

### Step 2: Update Dynamic Routes

```typescript
// /api/entities/[entity]/route.ts - GET handler
return withAuth(async (user, supabase) => {
	// Check if entity has query layer
	if (config.queryLayer) {
		// Parse pagination from query params
		const searchParams = request.nextUrl.searchParams;
		const page = searchParams.get('page');
		const limit = searchParams.get('limit');

		// Use query layer
		const result = await config.queryLayer.getAll(
			{ supabase },
			{ pagination: { page, limit } }
		);

		return successResponse(result.data);
	}

	// Fallback: Direct query for entities without query layer
	const { data } = await supabase.from(config.tableName).select('*');
	return successResponse(data);
});
```

### Step 3: Migrate Entities One by One

1. ✅ committees - Done
2. 🔄 members - Partial
3. ⏳ seasons - Todo
4. ⏳ categories - Todo
5. ⏳ todos - Todo

## Benefits

✅ **Single API route pattern** - Use `/api/entities/{entity}` for everything
✅ **Pagination support** - `GET /api/entities/committees?page=1&limit=10`
✅ **Query layer benefits** - Type safety, reusable, testable
✅ **Gradual migration** - Fallback for entities without query layer
✅ **No breaking changes** - Hooks continue to work during migration

## Quick Start

```bash
# 1. Update config (5 min)
#    Add queryLayer to ENTITY_CONFIGS

# 2. Update dynamic routes (15 min)
#    Add query layer support with fallback

# 3. Test committees (5 min)
#    Verify pagination works

# 4. Migrate other entities (2-3 hours each)
#    Create query layers, add to config
```

## Timeline

- **Phase 1**: Config setup - 2-4 hours
- **Phase 2**: Dynamic routes - 4-6 hours
- **Phase 3**: Migrate entities - 10-15 hours
- **Phase 4**: Cleanup - 2-3 hours

**Total: 18-28 hours**

## Next Action

**Start with Phase 1:**
1. Update `ENTITY_CONFIGS` interface to support `queryLayer`
2. Add committees query layer to config
3. Test to validate approach

See `DYNAMIC_ROUTES_QUERY_LAYER_INTEGRATION.md` for detailed plan.