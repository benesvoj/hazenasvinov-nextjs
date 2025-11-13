# API Routes Script Fix - Summary

## ✅ Problem Solved

The `scripts/generate-api-routes.mjs` script was only generating the `byId` function for the `entities` dynamic routes, but not the `root` function needed for accessing collection endpoints like `/api/entities/members`.

## 🔧 Changes Made

### 1. Modified Dynamic Segment Handling (Line 116)

**Before:**
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

**After:**
```javascript
} else if (isLast) {
  // Last segment is dynamic
  // Create 'byId' for [id] segments, 'root' for other dynamic segments like [entity]
  const funcName = paramName === 'id' ? 'byId' : 'root';
  current[funcName] = {
    _isDynamic: true,
    _path: route.fullPath,
    _paramName: paramName
  };
}
```

### 2. Fixed Root Property Handling in generateCode (Lines 210-219, 244-248)

**Changed internal key skipping logic:**
```javascript
// Skip internal metadata keys, but NOT 'root' if it's a dynamic function
if (key === '_isDynamic' || key === '_isDynamicNested' || key === '_path' || key === '_paramName' || key === '_params') {
  continue; // Skip internal keys
}

// Skip 'root' only if it's a string (static route handled separately)
if (key === 'root' && typeof value === 'string') {
  continue; // This will be handled in the parent object's root property
}
```

**Fixed static root property generation:**
```javascript
// If there's a root AND it's a string (static route), add it first
// Don't add it if it's a dynamic function object (will be handled in recursion)
if (value.root && typeof value.root === 'string') {
  code += `${indentStr}  root: '${value.root}' as const,\n`;
}
```

## 📊 Result

### Before Fix:
```typescript
entities: {
  byId: (entity: string | number, id: string | number) => `/api/entities/${entity}/${id}`,
},
```

### After Fix:
```typescript
entities: {
  byId: (entity: string | number, id: string | number) => `/api/entities/${entity}/${id}`,
  root: (entity: string | number) => `/api/entities/${entity}`,
},
```

## 💡 Usage Examples

Now you can use both functions:

```typescript
import { API_ROUTES } from '@/lib/api-routes';

// Fetch all members (collection endpoint)
fetch(API_ROUTES.entities.root('members'))
// => GET /api/entities/members

// Fetch all categories
fetch(API_ROUTES.entities.root('categories'))
// => GET /api/entities/categories

// Fetch specific member by ID
fetch(API_ROUTES.entities.byId('members', '123'))
// => GET /api/entities/members/123

// Fetch specific category by ID
fetch(API_ROUTES.entities.byId('categories', '456'))
// => GET /api/entities/categories/456
```

## 🎯 How It Works

1. **Dynamic Segment Detection:** When the script encounters a dynamic segment like `[entity]` or `[id]`, it determines the function name:
   - `[id]` → creates `byId` function
   - `[entity]`, `[slug]`, or any other → creates `root` function

2. **Type-Safe Generation:** Both functions are properly typed with parameter names and return template literal types.

3. **Backward Compatibility:** All existing routes continue to work as before. This fix only affects dynamic segments with non-`id` parameter names.

## 🔄 Regenerating Routes

After any changes to API route files, run:

```bash
npm run generate:api-routes
```

The script will automatically:
- ✅ Scan all route files in `/src/app/api/`
- ✅ Generate both `root` and `byId` functions for dynamic entity routes
- ✅ Maintain type safety with proper TypeScript types
- ✅ Update `/src/lib/api-routes.ts`

## 🚀 Next Steps

With this fix in place, you can now:

1. **Use the dynamic entity routes in your hooks:**
   ```typescript
   // In useFetchMembers.ts
   const res = await fetch(API_ROUTES.entities.root('members'));
   ```

2. **Implement the consolidation pattern** described in `DYNAMIC_ROUTE_CONSOLIDATION_GUIDE.md`

3. **Add entity configurations** to `/src/app/api/entities/config.ts`:
   ```typescript
   export const ENTITY_CONFIGS = {
     members: {
       tableName: 'members',
       sortBy: [{ column: 'surname', ascending: true }],
       requiresAdmin: true,
     },
     // ... add more entities
   };
   ```

4. **Gradually migrate hooks** from old routes to new dynamic entity routes

## 📝 Files Modified

- ✅ `/scripts/generate-api-routes.mjs` - Fixed script logic
- ✅ `/src/lib/api-routes.ts` - Regenerated with correct output

## ✨ Benefits

- **Type Safety:** Full TypeScript support with autocomplete
- **Consistency:** All entity routes follow the same pattern
- **Maintainability:** One place to update route generation logic
- **Scalability:** Easy to add new entities without creating new route files

## 🧪 Testing

Verify the fix works:

```typescript
import { API_ROUTES } from '@/lib/api-routes';

// Test that both functions exist
console.log(API_ROUTES.entities.root);      // Should be a function
console.log(API_ROUTES.entities.byId);      // Should be a function

// Test function calls
console.log(API_ROUTES.entities.root('members'));       // /api/entities/members
console.log(API_ROUTES.entities.byId('members', '1')); // /api/entities/members/1
```

## 📚 Related Documentation

- [DYNAMIC_ROUTE_CONSOLIDATION_GUIDE.md](./DYNAMIC_ROUTE_CONSOLIDATION_GUIDE.md) - Full guide on using dynamic entity routes
- [CODEBASE_ARCHITECTURE_ANALYSIS.md](./CODEBASE_ARCHITECTURE_ANALYSIS.md) - Section 8.2 on API route consolidation
- [API_ROUTES_SCRIPT_FIX.md](./API_ROUTES_SCRIPT_FIX.md) - Detailed technical analysis of the fix