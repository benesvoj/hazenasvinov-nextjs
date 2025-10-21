# API Folder Structure Recommendations

## Current Situation Analysis

**Date:** 2025-10-21
**Total API Routes:** 32
**Total Directories:** 41
**Current Depth:** Up to 3 levels

### Current Structure Issues

1. **Inconsistent Naming Conventions**
   - Mix of `get-*`, `post-*`, `manage-*` prefixes
   - Some resources plural (`members-internal`), some singular
   - Verb-based vs resource-based naming

2. **Flat Structure with Growing Clutter**
   - 32 top-level directories in `/api`
   - Related resources scattered (e.g., 6 member-related endpoints at root level)
   - Test endpoints mixed with production endpoints

3. **Lack of Logical Grouping**
   - Member-related: `members-internal`, `members-external`, `members-on-loan`, `members-with-payment-status`, `member-payments`, `member-payment-status`
   - User-related: `get-users`, `manage-users`, `check-user`, `user-roles`, `log-login`
   - Category-related: `get-categories`, `post-category`, `category-fees`
   - Auth-related: `reset-password`, `simple-reset-password`

4. **Good Examples Already Present**
   - `betting/*` - Well-organized subdirectory
   - `sponsorship/*` - Good resource grouping
   - `admin/*` - Logical admin grouping

---

## Recommended Structure

### Proposed Organization

```
src/app/api/
├── members/                          # Member management (consolidated)
│   ├── route.ts                     # GET, POST /api/members (all members with ?type= filter)
│   ├── internal/
│   │   └── route.ts                 # GET /api/members/internal (specialized view)
│   ├── external/
│   │   └── route.ts                 # GET /api/members/external (specialized view)
│   ├── on-loan/
│   │   └── route.ts                 # GET /api/members/on-loan (specialized view)
│   ├── functions/
│   │   └── route.ts                 # GET, POST /api/members/functions (manage member functions)
│   └── [id]/
│       ├── route.ts                 # GET, PATCH, DELETE /api/members/:id
│       └── payments/
│           ├── route.ts             # GET, POST /api/members/:id/payments
│           └── status/
│               └── route.ts         # GET /api/members/:id/payments/status
│
├── categories/                       # Category management
│   ├── route.ts                     # GET, POST /api/categories
│   ├── [id]/
│   │   └── route.ts                 # GET, PATCH, DELETE /api/categories/:id
│   └── fees/
│       └── route.ts                 # GET /api/categories/fees
│
├── users/                           # User management
│   ├── route.ts                     # GET, POST /api/users
│   ├── [id]/
│   │   └── route.ts                 # GET, PATCH, DELETE /api/users/:id
│   ├── current/
│   │   └── route.ts                 # GET /api/users/current (check-user)
│   ├── roles/
│   │   └── route.ts                 # GET, POST /api/users/roles
│   └── login-log/
│       └── route.ts                 # POST /api/users/login-log
│
├── auth/                            # Authentication
│   ├── reset-password/
│   │   └── route.ts                 # POST /api/auth/reset-password
│   └── simple-reset-password/
│       └── route.ts                 # POST /api/auth/simple-reset-password
│
├── betting/                         # Already well-structured
│   ├── get-user-bets/
│   │   └── route.ts
│   ├── get-wallet/
│   │   └── route.ts
│   ├── leaderboard/
│   │   └── route.ts
│   ├── place-bet/
│   │   └── route.ts
│   └── settle-bets/
│       └── route.ts
│
├── sponsorship/                     # Already well-structured
│   ├── main-partners/
│   │   ├── route.ts
│   │   └── [id]/
│   │       └── route.ts
│   ├── media-partners/
│   │   └── route.ts
│   └── business-partners/
│       └── route.ts
│
├── seasons/                         # Seasons management
│   └── route.ts                     # GET /api/seasons
│
├── club/                            # Club-wide settings
│   ├── config/
│   │   └── route.ts                 # GET /api/club/config
│   └── page-visibility/
│       └── route.ts                 # GET /api/club/page-visibility
│
├── admin/                           # Admin-only operations
│   └── materialized-views/
│       └── refresh/
│           └── route.ts             # POST /api/admin/materialized-views/refresh
│
├── dev/                             # Development/testing endpoints
│   ├── test-blog-posts/
│   │   └── route.ts
│   ├── test-login-log/
│   │   └── route.ts
│   ├── test-materialized-view/
│   │   └── route.ts
│   ├── test-page-visibility/
│   │   └── route.ts
│   ├── test-password-reset/
│   │   └── route.ts
│   └── extract-schema/
│       └── route.ts
│
├── status/                          # Health check
│   └── route.ts                     # GET /api/status
│
└── api.ts                           # API constants (consider moving to src/lib/api-routes.ts)
```

---

## Naming Convention: Plural vs Singular

### The Rule: **Always Use Plural for Folder Names**

**Folder Structure:**
```
/api/members/         ✅ Correct (plural)
/api/member/          ❌ Incorrect (singular)
```

**Why Plural?**
1. **RESTful Convention:** Collections are plural (`/users`, `/products`, `/orders`)
2. **Semantic Clarity:** The folder represents "all members", not "one member"
3. **Industry Standard:** Express, Rails, Django, Laravel all use plural
4. **Consistency:** Matches database table naming (usually plural)

### Folder Layout Pattern

```
/api/{resource}/              # Plural folder name
    ├── route.ts             # Handles collection: GET (list all), POST (create)
    └── [id]/                # Dynamic route for single item
        └── route.ts         # Handles item: GET (one), PATCH (update), DELETE (delete)
```

### Real Example from Your Codebase

**Current (Good):**
```
/api/sponsorship/
    └── main-partners/           # ✅ Plural
        ├── route.ts             # GET all, POST create
        └── [id]/
            └── route.ts         # GET one, PUT update, DELETE delete
```

**URL Mapping:**
```
GET    /api/members              → List all members
POST   /api/members              → Create new member
GET    /api/members/123          → Get member with ID 123
PATCH  /api/members/123          → Update member with ID 123
DELETE /api/members/123          → Delete member with ID 123
```

### Special Cases

#### Sub-resources (also plural)
```
/api/members/[id]/payments/       # ✅ Plural (member has many payments)
    ├── route.ts                 # GET list, POST create
    └── [paymentId]/
        └── route.ts             # GET one, PATCH, DELETE
```

#### Singleton Resources (singular)
```
/api/members/[id]/profile/        # ✅ Singular (member has ONE profile)
    └── route.ts                 # GET, PATCH (no collection, no POST)

/api/user/session/               # ✅ Singular (current user has ONE session)
    └── route.ts                 # GET current session
```

#### Utility Endpoints (descriptive names)
```
/api/members/functions/          # ✅ Not a CRUD resource, utility endpoint
/api/members/export/             # ✅ Action-based endpoint
/api/auth/reset-password/        # ✅ Action-based endpoint
```

### Member-Specific Structure

```
/api/members/                     # ✅ Plural folder
    ├── route.ts                 # Collection operations
    ├── internal/                # Filtered view (still plural conceptually)
    ├── external/                # Filtered view (still plural conceptually)
    ├── on-loan/                 # Filtered view (still plural conceptually)
    ├── functions/               # Utility endpoint (manages member functions)
    └── [id]/                    # Individual member
        ├── route.ts             # Single member operations
        └── payments/            # ✅ Sub-resource (plural)
            ├── route.ts         # List/create payments
            └── [paymentId]/
                └── route.ts     # Single payment operations
```

### Why Not `/api/members/member/[id]`?

This is **redundant and unnecessary**:
```
/api/members/member/[id]         # ❌ Redundant
/api/members/[id]                # ✅ Clean and RESTful
```

The `[id]` dynamic segment already indicates "a single member", no need for `/member/` in between.

### Visual Comparison

```
❌ WRONG - Redundant singular folder
/api/
  └── members/
      └── member/              # ← Unnecessary!
          └── [id]/
              └── route.ts

✅ CORRECT - Clean RESTful structure
/api/
  └── members/                 # ← Plural folder
      ├── route.ts            # ← Collection endpoint
      └── [id]/               # ← Direct dynamic route
          └── route.ts        # ← Individual item endpoint
```

### Quick Reference Table

| Pattern | Folder Name | Route.ts Location | URL | Purpose |
|---------|-------------|------------------|-----|---------|
| Collection | `/members/` | `/members/route.ts` | `GET /api/members` | List all |
| Collection | `/members/` | `/members/route.ts` | `POST /api/members` | Create one |
| Individual | `/members/` | `/members/[id]/route.ts` | `GET /api/members/123` | Get one |
| Individual | `/members/` | `/members/[id]/route.ts` | `PATCH /api/members/123` | Update one |
| Individual | `/members/` | `/members/[id]/route.ts` | `DELETE /api/members/123` | Delete one |
| Sub-collection | `/members/` | `/members/[id]/payments/route.ts` | `GET /api/members/123/payments` | List member's payments |
| Sub-item | `/members/` | `/members/[id]/payments/[paymentId]/route.ts` | `GET /api/members/123/payments/456` | Get specific payment |

### Summary

**✅ DO:**
- Use plural folder names for resources: `/api/members/`, `/api/categories/`, `/api/users/`
- Put collection operations in `/members/route.ts`
- Put individual operations in `/members/[id]/route.ts`
- Use `[id]` directly under the resource folder
- Use descriptive names for utility endpoints: `/members/functions/`, `/auth/reset-password/`

**❌ DON'T:**
- Create redundant singular folders: `/api/members/member/[id]/` ← NO!
- Use verb-based folder names: `/api/get-members/` ← NO!
- Mix singular/plural inconsistently

**Following this pattern makes your API:**
- Self-documenting
- Predictable for other developers
- Compatible with API tooling (Swagger, Postman)
- Easy to version and scale

---

## Key Improvements

### 1. **RESTful Resource Grouping**

**Before:**
```
/api/members-internal
/api/members-external
/api/member-payments
/api/member-payment-status
```

**After:**
```
/api/members/internal
/api/members/external
/api/members/:id/payments
/api/members/:id/payments/status
```

**Benefits:**
- Clear hierarchical structure
- RESTful conventions
- Easier to understand relationships
- Natural API versioning path

---

### 2. **Consistent Naming Convention**

**Rules:**
- **Resource-based** (not verb-based): `/api/users` not `/api/get-users`
- **Plural nouns** for collections: `/api/members` not `/api/member`
- **HTTP verbs** define actions (GET, POST, PATCH, DELETE)
- **Nested resources** show relationships: `/api/members/:id/payments`

**Before:**
```
/api/get-users          (GET)
/api/manage-users       (POST)
/api/get-categories     (GET)
/api/post-category      (POST)
```

**After:**
```
/api/users              (GET, POST)
/api/categories         (GET, POST)
```

---

### 3. **Environment Separation**

**Development/Test Endpoints:**
Move all `test-*` and debugging endpoints to `/api/dev/`

**Benefits:**
- Easy to disable in production
- Clear separation of concerns
- Can apply different middleware/auth
- Prevents accidental exposure

**Implementation:**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block /api/dev in production
  if (pathname.startsWith('/api/dev') && process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }

  return NextResponse.next();
}
```

---

### 4. **Resource-Oriented Design**

**Pattern:**
```
/api/{resource}/                    # Collection endpoints
/api/{resource}/{id}               # Item endpoints
/api/{resource}/{id}/{sub-resource} # Related resources
```

**Examples:**

**Members:**
```typescript
GET    /api/members                    # List all (with query params for type)
GET    /api/members?type=internal      # List internal members
GET    /api/members?type=external      # List external members
GET    /api/members/:id                # Get specific member
PATCH  /api/members/:id                # Update member
DELETE /api/members/:id                # Delete member
GET    /api/members/:id/payments       # Get member's payments
POST   /api/members/:id/payments       # Create payment
GET    /api/members/:id/payments/status # Get payment status
```

**Categories:**
```typescript
GET    /api/categories                 # List all categories
POST   /api/categories                 # Create category
GET    /api/categories/:id             # Get specific category
PATCH  /api/categories/:id             # Update category
DELETE /api/categories/:id             # Delete category
GET    /api/categories/:id/fees        # Get category fees
```

---

### 5. **Betting API (Already Good, Minor Tweaks)**

**Current:**
```
/api/betting/get-user-bets
/api/betting/get-wallet
/api/betting/place-bet
```

**Suggested (more RESTful):**
```
/api/betting/bets           (GET for list, POST to place)
/api/betting/wallet         (GET)
/api/betting/leaderboard    (GET)
/api/betting/bets/settle    (POST) - admin action
```

---

## Migration Strategy

### Phase 1: Add New Routes (Non-Breaking)

1. **Create new structure alongside old**
2. **Implement route redirects/proxies**
3. **Update frontend code gradually**

**Example proxy route:**
```typescript
// src/app/api/get-users/route.ts
import { GET as UsersGET } from '../users/route';
export { UsersGET as GET };

// Or redirect
export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = '/api/users';
  return Response.redirect(url, 308);
}
```

---

### Phase 2: Update API Constants

**Current (`src/app/api/api.ts`):**
```typescript
export const Api = {
  getUsers: '/api/get-users',
  getSeasons: '/api/get-seasons',
  getCategories: '/api/get-categories',
  // ...
} as const;
```

**Recommended (`src/lib/api-routes.ts`):**
```typescript
export const API_ROUTES = {
  members: {
    base: '/api/members',
    internal: '/api/members/internal',
    external: '/api/members/external',
    onLoan: '/api/members/on-loan',
    functions: '/api/members/functions',
    byId: (id: string) => `/api/members/${id}`,
    payments: (id: string) => `/api/members/${id}/payments`,
    paymentStatus: (id: string) => `/api/members/${id}/payments/status`,
  },
  categories: {
    base: '/api/categories',
    byId: (id: string) => `/api/categories/${id}`,
    fees: '/api/categories/fees',
  },
  users: {
    base: '/api/users',
    byId: (id: string) => `/api/users/${id}`,
    current: '/api/users/current',
    roles: '/api/users/roles',
    loginLog: '/api/users/login-log',
  },
  auth: {
    resetPassword: '/api/auth/reset-password',
    simpleResetPassword: '/api/auth/simple-reset-password',
  },
  betting: {
    bets: '/api/betting/bets',
    wallet: '/api/betting/wallet',
    leaderboard: '/api/betting/leaderboard',
    settle: '/api/betting/bets/settle',
  },
  sponsorship: {
    mainPartners: '/api/sponsorship/main-partners',
    mediaPartners: '/api/sponsorship/media-partners',
    businessPartners: '/api/sponsorship/business-partners',
  },
  club: {
    config: '/api/club/config',
    pageVisibility: '/api/club/page-visibility',
  },
  seasons: '/api/seasons',
  status: '/api/status',
} as const;

// Type-safe usage
import { API_ROUTES } from '@/lib/api-routes';

// In components/hooks
fetch(API_ROUTES.members.internal);
fetch(API_ROUTES.members.payments('member-123'));
```

---

### Phase 3: Deprecation & Cleanup

1. **Mark old routes as deprecated** (add warnings in dev mode)
2. **Monitor usage** (add logging)
3. **Remove old routes** after migration complete

**Deprecation wrapper:**
```typescript
// src/lib/api-deprecated.ts
export function deprecatedRoute(newPath: string) {
  return async function handler(request: Request) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[DEPRECATED] This route is deprecated. Use ${newPath} instead.`
      );
    }

    // Proxy to new route
    const url = new URL(request.url);
    url.pathname = newPath;
    return fetch(url);
  };
}

// Usage in old route
export const GET = deprecatedRoute('/api/members/internal');
```

---

## Additional Best Practices

### 1. **Shared Utilities**

Create reusable API utilities:

```
src/lib/api/
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   ├── error-handler.ts     # Centralized error handling
│   └── validation.ts        # Request validation
├── utils/
│   ├── supabase.ts          # Supabase client helpers
│   ├── response.ts          # Standard response formats
│   └── pagination.ts        # Pagination utilities
└── types/
    └── api.ts               # Shared API types
```

**Example usage:**
```typescript
// src/app/api/members/route.ts
import { withAuth, handleError, paginate, apiResponse } from '@/lib/api';

export const GET = withAuth(async (request, { user }) => {
  try {
    const { page, limit, search } = request.query;
    const { data, pagination } = await paginate({
      table: 'members',
      page,
      limit,
      search,
    });

    return apiResponse.success(data, { pagination });
  } catch (error) {
    return handleError(error);
  }
});
```

---

### 2. **OpenAPI/Swagger Documentation**

Consider generating API documentation:

```typescript
// src/app/api/docs/route.ts
import { generateOpenAPISpec } from '@/lib/api/openapi';

export async function GET() {
  const spec = generateOpenAPISpec({
    version: '1.0.0',
    title: 'Hazenasvinov API',
    routes: API_ROUTES,
  });

  return Response.json(spec);
}
```

---

### 3. **API Versioning Strategy**

**Option A: Path Versioning (Recommended for major changes)**
```
/api/v1/members
/api/v2/members
```

**Option B: Header Versioning**
```typescript
// Accept-Version: 1.0
export async function GET(request: Request) {
  const version = request.headers.get('Accept-Version') || '1.0';

  if (version === '2.0') {
    return handleV2(request);
  }

  return handleV1(request);
}
```

---

### 4. **Rate Limiting & Caching**

```typescript
// src/middleware.ts
import { rateLimit } from '@/lib/api/rate-limit';

export const config = {
  matcher: '/api/:path*',
};

export async function middleware(request: NextRequest) {
  // Rate limiting
  const limiter = rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 500,
  });

  try {
    await limiter.check(10, 'API_RATE_LIMIT'); // 10 requests per minute
  } catch {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}
```

---

## Comparison: Before vs After

### Before (Current)
```
33 top-level directories
Mixed naming conventions (get-*, post-*, manage-*)
Scattered related resources
Test endpoints mixed with production
Flat structure difficult to navigate
```

### After (Proposed)
```
9 main resource groups + dev/admin
Consistent RESTful naming
Related resources grouped logically
Clear separation of test/production
Hierarchical structure easy to navigate
Type-safe route constants
```

---

## Impact Assessment

### Benefits
- **Developer Experience:** Easier to find and understand endpoints
- **Maintainability:** Related code grouped together
- **Scalability:** Clear pattern for adding new resources
- **API Clarity:** RESTful conventions easier for frontend devs
- **Type Safety:** Centralized route constants with TypeScript

### Risks
- **Breaking Changes:** Old frontend code needs updates
- **Migration Time:** 2-3 days for careful migration
- **Testing Required:** Ensure all endpoints work after migration

### Effort Estimate
- **Phase 1 (New Routes):** 1 day
- **Phase 2 (Update Constants):** 4 hours
- **Phase 3 (Frontend Migration):** 1-2 days
- **Phase 4 (Cleanup):** 4 hours

**Total:** 3-4 days

---

## Implementation Checklist

- [ ] Create new folder structure
- [ ] Implement proxy routes for backward compatibility
- [ ] Update `src/lib/api-routes.ts` with new constants
- [ ] Add deprecation warnings to old routes
- [ ] Update frontend fetch calls (search for `/api/` in components/hooks)
- [ ] Update tests
- [ ] Add API documentation
- [ ] Monitor logs for deprecated route usage
- [ ] Remove old routes after 1-2 sprints
- [ ] Update this document with final structure

---

## Recommendation

**Priority: MEDIUM-HIGH**

While not critical like performance issues, this refactoring will:
1. Make codebase more maintainable
2. Improve developer onboarding
3. Set foundation for API versioning
4. Reduce cognitive load when working with API

**Suggested Approach:**
- Start with **members/** consolidation (highest value, 6 routes affected)
- Then **users/** and **categories/**
- Keep **betting/** and **sponsorship/** as-is (already good)
- Move test endpoints to **dev/** (easy win)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-21
**Author:** Claude Code Analysis
