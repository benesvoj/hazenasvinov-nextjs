# API Routes Generator - Setup Complete ✅

## What Was Installed

### 1. Generator Script
**Location:** `scripts/generate-api-routes.mjs`

Automatically scans `src/app/api/` and generates type-safe route constants.

### 2. NPM Command
```bash
npm run generate:api-routes
```

### 3. Pre-commit Hook
**Location:** `.husky/pre-commit`

**Automatically runs when:**
- You commit changes to any file in `src/app/api/`
- Regenerates `src/lib/api-routes.ts`
- Stages the updated file
- Includes it in your commit

### 4. Generated Output
**Location:** `src/lib/api-routes.ts`

Type-safe constants with autocomplete support.

### 5. Documentation
**Location:** `docs/API_ROUTES_GENERATOR.md`

Complete usage guide and examples.

---

## How to Use

### Basic Usage

```typescript
import { API_ROUTES } from '@/lib/api-routes';

// Static routes
fetch(API_ROUTES.members.internal);
// => '/api/members/internal'

// Dynamic routes
fetch(API_ROUTES.sponsorship.mainPartners.byId('123'));
// => '/api/sponsorship/main-partners/123'
```

### Your Current Routes

Based on your codebase, here are the available routes:

```typescript
API_ROUTES.admin.updateMaterializedView
API_ROUTES.categoryFees
API_ROUTES.checkUser
API_ROUTES.clubConfig
API_ROUTES.extractSchema
API_ROUTES.getCategories
API_ROUTES.getMemberFunctions
API_ROUTES.getSeasons
API_ROUTES.getUsers
API_ROUTES.logLogin
API_ROUTES.manageUsers
API_ROUTES.memberPayments
API_ROUTES.memberPaymentStatus

API_ROUTES.members.external
API_ROUTES.members.functions
API_ROUTES.members.internal
API_ROUTES.members.membersWithPaymentStatus
API_ROUTES.members.onLoan

API_ROUTES.pageVisibility
API_ROUTES.postCategory
API_ROUTES.resetPassword
API_ROUTES.simpleResetPassword

API_ROUTES.sponsorship.businessPartners
API_ROUTES.sponsorship.mainPartners.root
API_ROUTES.sponsorship.mainPartners.byId(id)
API_ROUTES.sponsorship.mediaPartners

API_ROUTES.status
API_ROUTES.testBlogPosts
API_ROUTES.testLoginLog
API_ROUTES.testMaterializedView
API_ROUTES.testPageVisibility
API_ROUTES.userRoles
```

---

## Migration Examples

### Update Your Hooks

#### useFetchMembersInternal.ts (Line 18)

**Before:**
```typescript
const response = await fetch('/api/members-internal');
```

**After:**
```typescript
import { API_ROUTES } from '@/lib/api-routes';

const response = await fetch(API_ROUTES.members.internal);
```

#### useFetchMembersExternal.ts (Line 16)

**Before:**
```typescript
const response = await fetch('/api/members-external');
```

**After:**
```typescript
import { API_ROUTES } from '@/lib/api-routes';

const response = await fetch(API_ROUTES.members.external);
```

#### useFetchSeasons.ts

**Before:**
```typescript
const response = await fetch('/api/get-seasons');
```

**After:**
```typescript
import { API_ROUTES } from '@/lib/api-routes';

const response = await fetch(API_ROUTES.getSeasons);
```

---

## Testing the Pre-commit Hook

Your branch already has API route changes! When you commit:

```bash
git add .
git commit -m "Reorganize API routes"
```

You'll see:
```
🔄 API routes changed, regenerating API constants...
🔍 Scanning API directory...
📋 Found 32 API routes
🌳 Building route tree...
✍️  Generating TypeScript constants...
💾 Writing to src/lib/api-routes.ts
✅ API routes regenerated and staged
🔍 Running pre-commit checks on staged files...
✅ All checks passed! Proceeding with commit...
```

The updated `api-routes.ts` will be automatically included in your commit!

---

## Next Steps

### Immediate Actions

1. ✅ **Pre-commit hook is configured** - No action needed
2. ✅ **Script is ready** - Run `npm run generate:api-routes` anytime
3. ✅ **Documentation created** - See `docs/API_ROUTES_GENERATOR.md`

### Gradual Migration

You have several files using hardcoded paths:

**Files to update:**
- `src/hooks/entities/member/data/useFetchMembersExternal.ts`
- `src/hooks/entities/member/data/useFetchMembersInternal.ts`
- `src/hooks/entities/member/data/useFetchMembersOnLoan.ts`
- `src/hooks/entities/season/useFetchSeasons.ts`
- `src/hooks/entities/user/useFetchUsers.ts`

**Migration strategy:**
1. Update one hook at a time
2. Test to ensure it works
3. Continue with the next
4. Eventually delete `src/app/api/api.ts` (if exists)

### Optional Enhancements

Consider these future improvements:

1. **Watch mode for development:**
   ```json
   "generate:api-routes:watch": "nodemon --watch src/app/api --ext ts --exec npm run generate:api-routes"
   ```

2. **Add to build step** (in `package.json`):
   ```json
   "build": "npm run generate:api-routes && next build"
   ```

3. **TypeScript strict mode check:**
   ```bash
   npm run tsc:strict
   ```
   Should show no errors with the generated types.

---

## Benefits You'll Experience

### 1. Autocomplete
Type `API_ROUTES.` and see all available routes!

### 2. Refactoring Safety
Rename a route → Run generator → TypeScript shows all places to update

### 3. No More Typos
```typescript
// ❌ This will error at compile time
fetch(API_ROUTES.members.intrnal);  // "intrnal" doesn't exist

// ✅ This works
fetch(API_ROUTES.members.internal);
```

### 4. Self-Documenting
The generated file serves as a map of all API endpoints.

### 5. Consistent Naming
- Automatic camelCase conversion
- Standardized structure
- No more `/api/get-*` vs `/api/*` confusion

---

## Troubleshooting

### Route Not Showing Up?
Make sure the directory has a `route.ts` file:
```
✅ src/app/api/members/internal/route.ts
❌ src/app/api/members/internal/
```

### Hook Not Running?
Check if hook is executable:
```bash
chmod +x .husky/pre-commit
```

### Need to Regenerate Manually?
```bash
npm run generate:api-routes
```

### Check Generated Output
```bash
cat src/lib/api-routes.ts
```

---

## Files Modified

- ✅ `.husky/pre-commit` - Added API routes regeneration
- ✅ `package.json` - Added `generate:api-routes` script
- ✅ `scripts/generate-api-routes.mjs` - Generator script (new)
- ✅ `src/lib/api-routes.ts` - Generated constants (new)
- ✅ `docs/API_ROUTES_GENERATOR.md` - Full documentation (new)
- ✅ `docs/optimization/API_ROUTES_GENERATOR_SETUP.md` - This file (new)

---

**Setup Date:** 2025-10-21
**Status:** ✅ Complete and Ready to Use
**Next Action:** Start migrating your hooks to use `API_ROUTES`
