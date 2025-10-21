# API Routes Generator

## Overview

Automatically generates type-safe API route constants from your Next.js API directory structure. This eliminates hardcoded API paths and provides autocomplete for all your API routes.

## Quick Start

```bash
# Generate API route constants
npm run generate:api-routes

# Import and use
import { API_ROUTES } from '@/lib/api-routes';
fetch(API_ROUTES.members.internal);
```

**🔄 Auto-generated on commit** - No manual regeneration needed when committing API changes!

## Usage

### Generate Routes

```bash
npm run generate:api-routes
```

This scans `src/app/api/` and generates `src/lib/api-routes.ts` with all available routes.

### Import in Your Code

```typescript
import { API_ROUTES } from '@/lib/api-routes';

// Use in fetch calls
const response = await fetch(API_ROUTES.members.internal);
const data = await fetch(API_ROUTES.sponsorship.mainPartners.byId('123'));
```

## Examples

### Static Routes

```typescript
// Simple route
fetch(API_ROUTES.status);
// => '/api/status'

// Nested route
fetch(API_ROUTES.members.internal);
// => '/api/members/internal'

// Deep nesting
fetch(API_ROUTES.admin.updateMaterializedView);
// => '/api/admin/update-materialized-view'
```

### Dynamic Routes

Dynamic segments `[id]`, `[slug]`, etc. are automatically converted to functions:

```typescript
// Dynamic ID
fetch(API_ROUTES.sponsorship.mainPartners.byId('abc-123'));
// => '/api/sponsorship/main-partners/abc-123'

// Works with numbers too
fetch(API_ROUTES.sponsorship.mainPartners.byId(456));
// => '/api/sponsorship/main-partners/456'

// Root route is also available
fetch(API_ROUTES.sponsorship.mainPartners.root);
// => '/api/sponsorship/main-partners'
```

## File Structure Mapping

The generator maps your API directory structure to nested objects:

### Current Structure

```
src/app/api/
├── members/
│   ├── internal/route.ts         → API_ROUTES.members.internal
│   ├── external/route.ts         → API_ROUTES.members.external
│   ├── on-loan/route.ts          → API_ROUTES.members.onLoan
│   └── functions/route.ts        → API_ROUTES.members.functions
├── sponsorship/
│   ├── main-partners/
│   │   ├── route.ts             → API_ROUTES.sponsorship.mainPartners.root
│   │   └── [id]/route.ts        → API_ROUTES.sponsorship.mainPartners.byId(id)
│   ├── media-partners/route.ts   → API_ROUTES.sponsorship.mediaPartners
│   └── business-partners/route.ts → API_ROUTES.sponsorship.businessPartners
├── admin/
│   └── update-materialized-view/route.ts → API_ROUTES.admin.updateMaterializedView
└── status/route.ts               → API_ROUTES.status
```

### Naming Conventions

- **Kebab-case to camelCase**: `my-endpoint` → `myEndpoint`
- **Nested paths**: Preserved as nested objects
- **Dynamic segments**: Always named `byId()` regardless of parameter name
- **Root routes**: Available as `.root` when dynamic routes exist

## Benefits

### 1. Type Safety

```typescript
// ✅ Autocomplete works
fetch(API_ROUTES.members.internal);

// ❌ TypeScript error if typo
fetch(API_ROUTES.members.intrnal);  // Property 'intrnal' does not exist
```

### 2. Refactoring Safe

When you rename/move API routes:
1. Run `npm run generate:api-routes`
2. TypeScript will show errors where old paths are used
3. Fix all errors = guaranteed no broken API calls

### 3. No Magic Strings

**Before:**
```typescript
// ❌ Hard to refactor, no autocomplete
fetch('/api/members-internal');
fetch('/api/sponsorship/main-partners/' + id);
```

**After:**
```typescript
// ✅ Type-safe, refactorable, autocomplete
fetch(API_ROUTES.members.internal);
fetch(API_ROUTES.sponsorship.mainPartners.byId(id));
```

### 4. Documentation

The generated file serves as documentation of all available API routes.

## Integration with Existing Code

### Gradual Migration

You can migrate gradually. Both approaches work:

```typescript
// Old way (still works)
fetch('/api/members-internal');

// New way (recommended)
fetch(API_ROUTES.members.internal);
```

### Update Fetch Hooks

```typescript
// hooks/entities/member/data/useFetchMembersInternal.ts
import { API_ROUTES } from '@/lib/api-routes';

export const useFetchMembersInternal = () => {
  const fetchData = useCallback(async () => {
    // Before: const response = await fetch('/api/members-internal');
    const response = await fetch(API_ROUTES.members.internal);
    // ...
  }, []);
  // ...
};
```

### Update API Constants File

Replace the current `src/app/api/api.ts`:

**Before:**
```typescript
export const Api = {
  getUsers: '/api/get-users',
  getSeasons: '/api/get-seasons',
  getCategories: '/api/get-categories',
  // ...
} as const;
```

**After:**
```typescript
// Delete src/app/api/api.ts
// Use generated constants instead
import { API_ROUTES } from '@/lib/api-routes';
```

## Advanced Usage

### Query Parameters

The routes are just strings/functions, add query params as needed:

```typescript
const url = `${API_ROUTES.members.internal}?page=1&limit=25`;
fetch(url);

// Or using URLSearchParams
const url = new URL(API_ROUTES.members.internal, window.location.origin);
url.searchParams.set('page', '1');
url.searchParams.set('limit', '25');
fetch(url);
```

### Request Bodies

```typescript
fetch(API_ROUTES.members.internal, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', surname: 'Doe' })
});
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { API_ROUTES } from '@/lib/api-routes';

export function useMembers() {
  return useQuery({
    queryKey: ['members', 'internal'],
    queryFn: () => fetch(API_ROUTES.members.internal).then(r => r.json())
  });
}
```

## Automation

### Pre-commit Hook ✅ Enabled

The pre-commit hook is **already configured** in `.husky/pre-commit`. It automatically:

1. Detects if any files in `src/app/api/` are being committed
2. Runs `npm run generate:api-routes` if API changes detected
3. Stages the updated `src/lib/api-routes.ts` file
4. Prevents commit if generation fails

**What this means for you:**
- Add/modify API routes as normal
- Stage your changes: `git add src/app/api/my-route/route.ts`
- Commit: `git commit -m "Add new route"`
- **The hook automatically regenerates and includes the updated constants!**

**Hook logic:**
```bash
# Check if API routes have changed
API_CHANGED=$(git diff --cached --name-only | grep "^src/app/api/")

if [ -n "$API_CHANGED" ]; then
  echo "🔄 API routes changed, regenerating API constants..."
  npm run generate:api-routes
  git add src/lib/api-routes.ts
fi
```

### Watch Mode (Optional)

For development, you could add a watch script:

```json
{
  "scripts": {
    "generate:api-routes:watch": "nodemon --watch src/app/api --ext ts --exec npm run generate:api-routes"
  }
}
```

## Troubleshooting

### Route Not Showing Up

The generator only picks up directories with `route.ts` files:

```
✅ src/app/api/members/internal/route.ts      (will be detected)
❌ src/app/api/members/internal/              (no route.ts, ignored)
❌ src/app/api/members/internal/handler.ts    (wrong name, ignored)
```

### Dynamic Route Not Generated

Make sure the directory uses Next.js dynamic segment syntax:

```
✅ src/app/api/members/[id]/route.ts          (correct)
❌ src/app/api/members/:id/route.ts           (wrong syntax)
❌ src/app/api/members/id/route.ts            (not dynamic)
```

### Naming Conflicts

If you have routes that would generate the same camelCase name:

```
src/app/api/user-roles/route.ts     → userRoles
src/app/api/user_roles/route.ts     → userRoles  (conflict!)
```

Solution: Rename one of the directories to be more specific.

### Regenerate After Changes

Always regenerate after adding/removing/renaming API routes:

```bash
npm run generate:api-routes
```

## Future Enhancements

Potential improvements to consider:

1. **HTTP Method Support**: Generate separate constants for GET/POST/etc.
2. **OpenAPI Integration**: Generate OpenAPI spec alongside constants
3. **Validation**: Validate that routes actually exist at build time
4. **Path Parameters**: Support multiple dynamic segments (e.g., `/users/[userId]/posts/[postId]`)
5. **Type Generation**: Generate TypeScript types for request/response bodies

## Script Location

- **Script**: `scripts/generate-api-routes.mjs`
- **Output**: `src/lib/api-routes.ts`
- **Command**: `npm run generate:api-routes`

---

**Last Updated**: 2025-10-21
**Version**: 1.0.0
