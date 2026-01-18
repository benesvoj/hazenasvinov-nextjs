# API Routes Script Fix for Dynamic Entity Routes

## Problem

The current script at `scripts/generate-api-routes.mjs` generates:

```typescript
entities: {
  byId: (entity: string | number, id: string | number) => `/api/entities/${entity}/${id}`,
},
```

But we need:

```typescript
entities: {
  root: (entity: string) => `/api/entities/${entity}`,
  byId: (entity: string | number, id: string | number) => `/api/entities/${entity}/${id}`,
},
```

## Root Cause

When the script encounters `/api/entities/[entity]/route.ts`, it processes the `[entity]` dynamic segment as the last part and assumes it should create a `byId` function (lines 113-119):

```javascript
} else if (isLast) {
  // Last segment is dynamic - simple byId function
  current.byId = {
    _isDynamic: true,
    _path: route.fullPath,
    _paramName: paramName
  };
}
```

This logic is incorrect for dynamic segments that aren't named `[id]`.

## Solution

Modify the script to:
1. When a dynamic segment is NOT named `[id]`, create a function named after the parameter (e.g., `root` for `[entity]`)
2. When multiple dynamic segments exist in the path, use the existing nested logic
3. Preserve backward compatibility for all existing routes

### Modified Code (lines 113-131)

**Before:**
```javascript
} else if (isLast) {
  // Last segment is dynamic - simple byId function
  current.byId = {
    _isDynamic: true,
    _path: route.fullPath,
    _paramName: paramName
  };
} else {
  // Dynamic segment with static children after it
  // e.g., /categories/[id]/fees (where fees is static)
  const funcKey = toCamelCase(remainingParts.join('/'));

  current[funcKey] = {
    _isDynamicNested: true,
    _path: route.fullPath,
    _params: dynamicParams
  };
  break;
}
```

**After:**
```javascript
} else if (isLast) {
  // Last segment is dynamic
  if (paramName === 'id') {
    // Standard byId function for [id] segments
    current.byId = {
      _isDynamic: true,
      _path: route.fullPath,
      _paramName: paramName
    };
  } else {
    // For other dynamic segments (like [entity]), create a 'root' function
    // that takes the parameter
    current.root = {
      _isDynamic: true,
      _path: route.fullPath,
      _paramName: paramName
    };
  }
} else {
  // Dynamic segment with static children after it
  // e.g., /categories/[id]/fees (where fees is static)
  const funcKey = toCamelCase(remainingParts.join('/'));

  current[funcKey] = {
    _isDynamicNested: true,
    _path: route.fullPath,
    _params: dynamicParams
  };
  break;
}
```

## Expected Result After Fix

After applying the fix and running `npm run generate:api-routes`:

```typescript
entities: {
  root: (entity: string | number) => `/api/entities/${entity}`,
  byId: (entity: string | number, id: string | number) => `/api/entities/${entity}/${id}`,
},
```

## Usage Examples

```typescript
// Fetch all members using dynamic entity route
fetch(API_ROUTES.entities.root('members'))
// => /api/entities/members

// Fetch all categories
fetch(API_ROUTES.entities.root('categories'))
// => /api/entities/categories

// Fetch specific member by ID
fetch(API_ROUTES.entities.byId('members', '123'))
// => /api/entities/members/123

// Fetch specific category by ID
fetch(API_ROUTES.entities.byId('categories', '456'))
// => /api/entities/categories/456
```

## Alternative Solution (More Generic)

If we want to be more generic and handle any parameter name, we could name the function based on the parameter:

```javascript
} else if (isLast) {
  // Last segment is dynamic
  const funcName = paramName === 'id' ? 'byId' : 'root';
  current[funcName] = {
    _isDynamic: true,
    _path: route.fullPath,
    _paramName: paramName
  };
}
```

This ensures:
- `[id]` → creates `byId` function
- `[entity]` → creates `root` function
- `[slug]` → creates `root` function
- Any other parameter → creates `root` function

## Testing

After applying the fix:

1. Run the script:
   ```bash
   npm run generate:api-routes
   ```

2. Check the generated file includes both functions:
   ```bash
   grep -A 3 "entities:" src/lib/api-routes.ts
   ```

3. Expected output:
   ```typescript
   entities: {
     root: (entity: string | number) => `/api/entities/${entity}`,
     byId: (entity: string | number, id: string | number) => `/api/entities/${entity}/${id}`,
   },
   ```

4. Test in code:
   ```typescript
   import { API_ROUTES } from '@/lib/api-routes';

   console.log(API_ROUTES.entities.root('members'));
   // Output: /api/entities/members

   console.log(API_ROUTES.entities.byId('members', '123'));
   // Output: /api/entities/members/123
   ```

## Impact Analysis

This fix:
- ✅ Enables the dynamic entity route pattern described in `DYNAMIC_ROUTE_CONSOLIDATION_GUIDE.md`
- ✅ Maintains backward compatibility with all existing `byId` routes
- ✅ Allows proper usage of `/api/entities/[entity]` endpoints
- ⚠️ May affect other routes with non-`[id]` dynamic segments (review needed)

## Potential Issues to Check

Routes to review after applying this fix:
```bash
find src/app/api -type d -name '\[*\]' ! -name '\[id\]' | grep -v node_modules
```

This will show all dynamic segments that aren't `[id]` and need to be verified to work correctly with the new logic.