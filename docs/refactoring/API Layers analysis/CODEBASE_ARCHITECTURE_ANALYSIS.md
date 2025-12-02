# Comprehensive Codebase Architecture Analysis
## HazenaSvinov Next.js Application

### Executive Summary
This is a Next.js 16 application with 732 TypeScript/TSX files organized around domain entities. The architecture follows a **layered approach with clear separation of concerns**: API routes handle server-side data access, hooks manage client-side state and data fetching, and components render the UI. The application uses Supabase as the database backend and React Query for caching.

---

## 1. PROJECT STRUCTURE OVERVIEW

### Root Organization
```
/src
├── app/                     # Next.js app directory (pages & API routes)
├── components/              # React components (12 subdirectories)
├── hooks/                   # Custom hooks (~120+ hooks)
├── services/                # Service/query layer (match queries, betting)
├── utils/                   # Utility functions (24 files)
├── types/                   # TypeScript definitions
├── enums/                   # Enum exports
├── constants/               # App constants
├── contexts/                # React contexts
├── data/                    # Static/seed data
├── helpers/                 # Helper functions
├── lib/                     # Library utilities (API routes, translations, cache)
└── routes/                  # Route definitions
```

**Key Stats:**
- 732 TypeScript/TSX files total
- 120+ custom hooks
- 90 entity-specific hooks
- 54 API routes using Supabase
- 70+ hooks using Supabase/fetch
- 5 test files (.test.ts)

---

## 2. ARCHITECTURAL PATTERNS & LAYERS

### 2.1 Layer Architecture

The application follows a **3-tier layered architecture**:

```
┌─────────────────────────────────────────┐
│         UI Components Layer              │
│  (src/components/features/*)            │
│  - Renders using hooks & contexts       │
│  - No direct DB queries                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Hooks/State Management Layer          │
│  (src/hooks/entities/*)                 │
│  - Data fetching (useFetch*)            │
│  - State management (use*)              │
│  - Business logic (use*Business)        │
│  - Makes fetch() calls to API routes    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      API Routes Layer                    │
│  (src/app/api/*)                        │
│  - Next.js API routes (route.ts)        │
│  - Direct Supabase queries              │
│  - Authentication & Authorization       │
│  - Error handling (withAuth, withAdminAuth)
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Database Layer                      │
│  (Supabase PostgreSQL)                  │
│  - Tables, views, RPC functions         │
└─────────────────────────────────────────┘
```

### 2.2 Data Flow Pattern

```
User Action
    ↓
Component (useFetch/useState hooks)
    ↓
fetch(API_ROUTES.entity.root)
    ↓
API Route Handler (route.ts)
    ↓
Supabase Query (withAuth/withAdminAuth)
    ↓
Response sent to component
    ↓
Component updates UI
```

### 2.3 Existing Architectural Features

#### A. API Route Constants (Type-Safe)
**File:** `/src/lib/api-routes.ts` (auto-generated)

```typescript
export const API_ROUTES = {
  members: {
    root: '/api/members',
    byId: (id) => `/api/members/${id}`,
    external: '/api/members/external',
    internal: '/api/members/internal',
    relationships: (id) => `/api/members/${id}/relationships`,
  },
  // ... 40+ entity endpoints
};
```

**Benefit:** Type-safe route references, auto-completion, prevents typos

#### B. API Helper Utilities (Server-Only)
**File:** `/src/utils/supabase/apiHelpers.ts`

```typescript
// Wrapper functions for consistent authentication & error handling
export async function withAuth(handler: AuthHandler): Promise<NextResponse> {
  // Checks authentication, error handling, logging
}

export async function withAdminAuth(handler: AdminAuthHandler): Promise<NextResponse> {
  // Checks admin role, error handling
}
```

**Usage Pattern:** All 54 API routes use these helpers
```typescript
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase
      .from('members')
      .select('*');
    if (error) throw error;
    return successResponse(data);
  });
}
```

#### C. Middleware Authentication
**File:** `/src/proxy.ts`

- Protects `/admin` and `/coaches` routes
- Checks user authentication status
- Validates user roles via RPC: `get_user_profile_safe()`
- Handles blocked users

#### D. Supabase Clients Strategy
- **Server Client:** `/src/utils/supabase/server.ts` (RLS enabled)
- **Admin Client:** `/src/utils/supabase/admin.ts` (bypasses RLS for admin operations)
- **Client Component:** `/src/utils/supabase/client.ts` (for client-side queries)

---

## 3. DATA FETCHING & QUERY PATTERNS

### 3.1 Hook Naming Convention (Well-Organized)

The application follows a **strict 3-category naming convention** for hooks:

#### Category 1: Data Fetching (`useFetch*`)
**Location:** `src/hooks/entities/[entity]/data/`
**Purpose:** Read-only operations
**Returns:** `{data, loading, error, pagination?, refresh?}`

**Examples:**
```
- useFetchMembers()
- useFetchMembersInternal()
- useFetchMembersExternal()
- useFetchCategories()
- useFetchBlog()
- useFetchMatches()
```

#### Category 2: State Management (`use*`)
**Location:** `src/hooks/entities/[entity]/state/`
**Purpose:** CRUD operations, form state
**Returns:** `{create, update, delete, ...state}`

**Examples:**
```
- useMembers()           // Main CRUD hook
- useMemberForm()        // Form state
- useCategories()        // Category CRUD
- useTodos()             // Todo CRUD
```

#### Category 3: Business Logic (`use*Business` or domain-specific)
**Location:** `src/hooks/entities/[entity]/business/`
**Purpose:** Complex domain operations

**Examples:**
```
- useCategoryPageData()
- useMemberMetadata()
- useHeadToHeadMatches()
- useBulkEditMembers()
```

**See:** `/src/hooks/entities/README.md` (detailed naming guidelines)

### 3.2 Data Fetching Hook Examples

#### Simple Data Fetch Hook
**File:** `/src/hooks/entities/member/data/useFetchMembers.ts`

```typescript
'use client';
export function useFetchMembers() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ROUTES.members.root);
      const response = await res.json();
      setData(response.data || []);
    } catch (error) {
      setError('Error fetching members');
      showToast.danger('Error fetching members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
```

#### Advanced Data Fetch Hook with Pagination & Filtering
**File:** `/src/hooks/entities/member/data/useFetchMembersInternal.ts`

```typescript
export const useFetchMembersInternal = (options: UseFetchMembersInternalOptions = {}) => {
  const { page = 1, limit = 25, enabled = true, search = '', filters = {} } = options;
  
  // Uses refs for search/filters to avoid re-fetches
  // Implements pagination
  // Returns { data, loading, error, pagination, refresh, goToPage, changePageSize }
};
```

### 3.3 CRUD State Hook Examples

**File:** `/src/hooks/entities/member/state/useMembers.ts`

```typescript
export function useMembers() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const createMember = useCallback(async (formData: MemberFormData) => {
    // Validation → fetch(API_ROUTES.members.root, {POST})
    // Returns: Member
  }, []);

  const updateMember = useCallback(async (id: string, data: UpdateMemberData) => {
    // fetch(API_ROUTES.members.byId(id), {PUT})
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    // fetch(API_ROUTES.members.byId(id), {DELETE})
  }, []);

  return { createMember, updateMember, deleteMember, isLoading, errors };
}
```

### 3.4 Query Builder Pattern (Advanced)

**File:** `/src/utils/matchQueryBuilder.ts`

```typescript
export interface MatchQueryBuilderOptions {
  categoryId?: string;
  seasonId?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
  matchweek?: number;
  dateFrom?: string;
  dateTo?: string;
  ownClubOnly?: boolean;
  includeTeamDetails?: boolean;
  // ... 10+ more filters
}

// Usage in hook:
const query = createMatchQuery({
  categoryId,
  seasonId,
  ownClubOnly,
  includeTeamDetails,
});
const result = await query.executeSeasonal();
```

**Benefit:** Flexible, composable query construction

### 3.5 Service/Query Layer

**File:** `/src/services/matchQueries.ts`

Direct Supabase queries used by hooks (below the component layer):

```typescript
export async function getMatchesBasic(options: MatchQueryOptions = {}) {
  const supabase = createClient();
  let query = supabase.from('matches').select(BASIC_MATCH_SELECT);
  
  if (options.categoryId) query = query.eq('category_id', options.categoryId);
  if (options.status) query = query.eq('status', options.status);
  
  const {data, error} = await query;
  if (error) throw error;
  return {data, error: null, count: data?.length};
}

export async function getMatchesSeasonalOptimized(categoryId: string) {
  // Complex query with team details, split by season
}
```

**Clients Used:**
- `/src/utils/supabase/client.ts` - Client component queries
- `/src/utils/supabase/server.ts` - Server component queries

---

## 4. COMPONENT STRUCTURE

### 4.1 Component Organization

```
/src/components
├── boundaries/              # Error boundaries, suspense
├── features/                # Feature-specific components
│   ├── meeting-minutes/
│   ├── betting/
│   ├── lineup/
│   └── ...
├── providers/               # Context providers, layout wrappers
├── routes/                  # Route-specific layouts
├── shared/                  # Shared/reusable components
│   ├── match/
│   ├── member/
│   └── ...
└── ui/                      # Base UI components
    ├── forms/
    ├── layout/
    ├── modals/
    ├── tables/
    ├── cards/
    └── ...
```

### 4.2 Component Data Fetching Pattern

**Example:** `/src/components/features/meeting-minutes/MeetingMinutesContainer.tsx`

```typescript
'use client';

export const MeetingMinutesContainer = forwardRef<MeetingMinutesContainerRef>(
  ({onAddMeetingMinutes}, ref) => {
    // Multiple hooks for data fetching
    const { meetingMinutes, loading, createMeetingMinutes, updateMeetingMinutes } = 
      useMeetingMinutes();
    const { seasons, fetchAllSeasons } = useSeasons();

    // Direct fetch for related data (users)
    useEffect(() => {
      const fetchUsers = async () => {
        const response = await fetch(API_ROUTES.users);
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      };
      fetchUsers();
    }, []);

    // Renders sub-components with fetched data
    return (
      <MeetingMinutesCard meeting={meeting} />
      <MeetingMinutesFormModal meetingMinutes={editingMeetingMinutes} />
    );
  }
);
```

---

## 5. HARDCODED DATABASE QUERIES & API CALLS

### 5.1 API Route Handlers (54 total)

All API routes follow the **withAuth/withAdminAuth** pattern with direct Supabase queries:

**Pattern: Direct Supabase `.from()` queries in route handlers**

#### Examples with Line Numbers:

| Route | File | Pattern | Lines |
|-------|------|---------|-------|
| GET /api/members | `/src/app/api/members/route.ts` | `supabase.from('members').select('*')` | 14-18 |
| POST /api/members | `/src/app/api/members/route.ts` | `admin.from('members').insert({...body})` | 32-36 |
| GET /api/blog | `/src/app/api/blog/route.ts` | `supabase.from('blog_posts').select('*')` | 9-12 |
| POST /api/blog | `/src/app/api/blog/route.ts` | `admin.from('blog_posts').insert({...body})` | 23-27 |
| GET /api/categories | `route.ts` | `supabase.from('categories').select('*')` | Various |

**Key Finding:** All 54 API routes contain inline Supabase queries like:
```typescript
await supabase
  .from('members')
  .select('*')
  .order('surname', {ascending: true})
```

### 5.2 Hook-Level Fetch Calls (38 files)

**Location:** `/src/hooks/entities/*/data/useFetch*.ts`

**Pattern: fetch() calls to API_ROUTES endpoints**

```typescript
// useFetchMembers.ts (line 20)
const res = await fetch(API_ROUTES.members.root);

// useFetchMembersInternal.ts (line 79)
const response = await fetch(url.toString());

// useFetchMatches.ts (line 85)
const query = createMatchQuery({...});
const result = await query.executeSeasonal();
```

### 5.3 Service Layer Queries (matchQueries.ts)

**File:** `/src/services/matchQueries.ts` (240+ lines)

```typescript
// Line 80-100: Direct Supabase queries
export async function getMatchesBasic(options: MatchQueryOptions = {}) {
  const supabase = createClient();
  let query = supabase.from('matches').select(BASIC_MATCH_SELECT);
  
  if (options.categoryId) query = query.eq('category_id', options.categoryId);
  if (options.seasonId) query = query.eq('season_id', options.seasonId);
  if (options.status) query = query.eq('status', options.status);
  
  // Multiple filter conditions chained
  if (options.dateFrom) query = query.gte('date', options.dateFrom);
  if (options.dateTo) query = query.lte('date', options.dateTo);
  
  const {data, error} = await query.order('date', {ascending: false});
  if (error) throw error;
  return {data, error: null, count: data?.length};
}

// Line 150+: Complex joins
export async function getMatchesWithTeams(options: MatchQueryOptions = {}) {
  const supabase = createClient();
  let query = supabase.from('matches').select(
    `${BASIC_MATCH_SELECT},
     category:categories(id, name, description),
     home_team:home_team_id(
       id,
       team_suffix,
       club_category:club_categories(
         club:clubs(id, name, short_name, logo_url, is_own_club)
       )
     )`
  );
  // ... applies filters
}
```

### 5.4 Component-Level Direct Fetches

**Example:** `/src/components/features/meeting-minutes/MeetingMinutesContainer.tsx` (line 75)

```typescript
const response = await fetch(API_ROUTES.users);
const data = await response.json();
setUsers(Array.isArray(data) ? data : data.users || []);
```

---

## 6. DEPENDENCY & DATA FLOW MAPPING

### 6.1 Entity-Based Dependency Graph

```
Page Component (e.g., admin/members/page.tsx)
    ↓
Feature Components (e.g., MembersTable, MemberForm)
    ↓
Multiple Hooks:
  ├── useFetchMembers() → fetch(API_ROUTES.members.root) → GET /api/members
  ├── useFetchMembersInternal() → fetch(API_ROUTES.members.internal) → GET /api/members/internal
  ├── useFetchMembersExternal() → fetch(API_ROUTES.members.external) → GET /api/members/external
  ├── useMembers() → fetch(API_ROUTES.members.root, {POST/PUT/DELETE})
  └── useMembersTable() [Business Logic]
      └── useMembers(), useFetchMembers() + business logic
    ↓
API Routes:
  ├── GET /api/members (route.ts line 12-24)
  ├── POST /api/members (route.ts line 29-42)
  ├── GET /api/members/internal (internal/route.ts)
  ├── GET /api/members/external (external/route.ts)
  └── GET /api/members/on-loan (on-loan/route.ts)
    ↓
Supabase Queries:
  ├── supabase.from('members').select('*')
  ├── admin.from('members').insert({...})
  ├── supabase.from('members').update({...})
  └── supabase.from('members').delete()
    ↓
Database:
  └── PostgreSQL tables: members, member_functions, member_payments, etc.
```

### 6.2 Match/Category Data Flow

```
Page: /admin/matches
    ↓
Component: MatchSchedule
    ↓
Hooks:
  - useFetchMatches(categoryId, seasonId)
    → createMatchQuery() → query.executeSeasonal()
    → calls getMatchesBasic() / getMatchesWithTeams()
  - useOptimizedMatches() [Cached version]
    ↓
Services: /src/services/matchQueries.ts
  - getMatchesBasic()
  - getMatchesWithTeams()
  - getMatchesSeasonalOptimized()
    ↓
Supabase:
  - from('matches').select(...)
  - joins: categories, teams, club_categories, clubs
    ↓
Database:
  - matches, categories, teams, club_categories, clubs tables
```

### 6.3 Authentication Flow

```
Page: /admin/dashboard
    ↓
Middleware: /src/proxy.ts (lines 9-82)
  - Checks if user authenticated
  - Queries: supabase.from('user_profiles').select('role')
  - Falls back to RPC: get_user_profile_safe()
  - Checks if user blocked
    ↓
  If passes: Allow
  If fails: Redirect to /login
    ↓
API Routes use: withAuth() or withAdminAuth() wrapper
  - supabase.auth.getUser()
  - Checks admin role from Supabase
    ↓
Component renders with user context
```

---

## 7. CURRENT ARCHITECTURAL PATTERNS

### 7.1 Patterns Already in Place

| Pattern | Location | Status |
|---------|----------|--------|
| **Type-Safe Routes** | `/src/lib/api-routes.ts` | ✅ Implemented |
| **API Helper Wrappers** | `/src/utils/supabase/apiHelpers.ts` | ✅ Implemented |
| **Middleware Authentication** | `/src/proxy.ts` | ✅ Implemented |
| **Data/State/Business Hook Separation** | `/src/hooks/entities/*/` | ✅ Implemented |
| **Query Builder Pattern** | `/src/utils/matchQueryBuilder.ts` | ✅ Implemented |
| **Service Layer** | `/src/services/matchQueries.ts` | ✅ Partial |
| **Error Handling** | `/src/utils/supabase/apiHelpers.ts` | ✅ Implemented |
| **Authentication Layers** | Multiple files | ✅ Implemented |
| **Supabase Client Strategy** | `/src/utils/supabase/` (3 clients) | ✅ Implemented |
| **Component Export Automation** | Auto-generated exports | ✅ Implemented |

### 7.2 Architectural Strengths

1. **Clear Layer Separation:** Components → Hooks → API Routes → Database
2. **Consistent Hook Naming:** Immediate understanding of hook purpose (data/state/business)
3. **Reusable API Wrappers:** `withAuth()`, `withAdminAuth()` prevent code duplication
4. **Type Safety:** `API_ROUTES` constants, Zod validation
5. **Supabase Client Strategy:** 3 specialized clients (server, admin, client)
6. **Query Builder Pattern:** Flexible, chainable query construction
7. **Auto-Generated Exports:** Components/hooks organized via scripts
8. **Documentation:** README.md files in hooks/ and types/

---

## 8. AREAS FOR REFACTORING/GROUPING

### 8.1 Query Consolidation Opportunities

**Current State:** Hardcoded queries scattered across:
- 54 API routes
- Service layer (matchQueries.ts)
- Hook-level fetch calls

**Suggested Consolidation:**

```
/src/queries/                          ← NEW: Centralized query layer
├── members/
│   ├── queries.ts                    ← All SELECT queries
│   ├── mutations.ts                  ← CREATE, UPDATE, DELETE
│   └── index.ts
├── matches/
│   ├── queries.ts
│   └── mutations.ts
├── categories/
├── teams/
└── ...

Pattern:
// members/queries.ts
export async function getMembers() { ... }
export async function getMembersInternal() { ... }
export async function getMemberById(id) { ... }

// members/mutations.ts
export async function createMember(data) { ... }
export async function updateMember(id, data) { ... }
export async function deleteMember(id) { ... }
```

**Benefits:**
- Single source of truth for queries
- Easier to audit/maintain
- Reusable across API routes & services

### 8.2 API Route Consolidation

**Current:** Each entity has individual routes: `/api/members`, `/api/members/[id]`, etc.

**Suggested:** Dynamic route handlers using `[entity]/route.ts` pattern:

```
/src/app/api/entities/
├── [entity]/
│   ├── route.ts              ← GET all, POST create
│   └── [id]/
│       └── route.ts          ← GET by ID, PUT update, DELETE
└── ...

// Single handler processes all entities
```

### 8.3 Hook Factory Pattern

**Current:** Each hook manually calls `fetch()` and manages state

**Suggested:** Generate hooks from query functions:

```typescript
// Factory function
export function createDataFetchHook<T>(
  queryFn: () => Promise<T[]>,
  refreshInterval?: number
) {
  return () => {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
      // Standard implementation
    }, []);

    return { data, loading, error, refetch: fetchData };
  };
}

// Usage:
export const useFetchMembers = createDataFetchHook(
  () => fetch('/api/members').then(r => r.json())
);
```

### 8.4 API Response Standardization

**Current:** Some routes return `{data, error}`, some return `{users}` directly

**Suggested:** Enforce consistent response schema:

```typescript
// Standard response wrapper
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// All routes return this format
export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const {data, error} = await supabase.from('members').select('*');
    if (error) return errorResponse(error.message);
    return successResponse<Member[]>(data);
  });
}
```

### 8.5 Feature-Based Grouping

**Current:** Hooks grouped by entity (member, category, match)

**Suggested:** Also group by feature for complex features:

```
/src/features/                         ← NEW
├── betting/
│   ├── queries/
│   ├── mutations/
│   └── hooks/
├── lineup-management/
│   ├── queries/
│   ├── mutations/
│   └── components/
├── attendance-tracking/
└── ...
```

### 8.6 Validation Layer

**Current:** Validation scattered (form-level, API-level)

**Suggested:** Centralized validation schemas:

```
/src/validation/                       ← NEW
├── members.ts
├── categories.ts
├── matches.ts
└── index.ts

// Exported schemas
export const createMemberSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  registration_number: z.string(),
  // ...
});

// Used in hooks & API routes
const result = createMemberSchema.safeParse(formData);
```

---

## 9. COMPONENT GROUPING RECOMMENDATIONS

### 9.1 Current Feature Components

```
/src/components/features/
├── betting/               (8 files)
├── lineup/                (6 files)
├── meeting-minutes/       (4 files)
├── attendance/            (2 files)
├── member-import/         (bulk operations)
├── member-relationships/  (relationships)
├── standings/             (standings display)
└── ...
```

### 9.2 Recommended Grouping by Business Domain

```
/src/components/features/
├── admin/                 ← Admin-only features
│   ├── members-management/
│   ├── matches-management/
│   ├── categories-management/
│   └── ...
├── coaches/               ← Coaches portal
│   ├── lineups/
│   ├── attendance/
│   ├── videos/
│   └── ...
├── shared/                ← Public features
│   ├── match-schedule/
│   ├── results/
│   ├── standings/
│   └── ...
└── betting/               ← Cross-domain betting feature
    ├── odds/
    ├── leaderboard/
    └── wallet/
```

---

## 10. DEPENDENCY TREE - KEY RELATIONSHIPS

### 10.1 Critical Dependencies

```
Authentication
├── useAuth() / useAuthNew()
├── middleware (proxy.ts)
├── apiHelpers (withAuth, withAdminAuth)
└── Supabase Auth

Members
├── useFetchMembers()
├── useFetchMembersInternal()
├── useFetchMembersExternal()
├── useMembers() [CRUD]
├── useMemberMetadata()
├── useMemberClubRelationships()
└── Related: useMembersTable(), useBulkEditMembers()

Categories
├── useFetchCategories()
├── useCategories() [CRUD]
├── useCategoryForm()
├── useCategoryLineups()
├── useFetchCategoryLineups()
└── useCategoryPageData() [Business Logic]

Matches
├── useFetchMatches()
├── useFetchMatchVideos()
├── useFetchMatchPosts()
├── useMatchQueries() [Service layer]
├── useOptimizedMatches() [Cached]
└── Services: getMatchesBasic(), getMatchesWithTeams(), getMatchesSeasonalOptimized()

Lineups
├── useLineupData()
├── useLineupManager()
├── useMatchLineupStats()
└── Dependencies: useFetchMatches(), useMembers()

Teams/Clubs
├── useTeams()
├── useClubs()
├── useFilteredTeams()
└── useTeamClubId()
```

### 10.2 Cross-Cutting Concerns

```
Error Handling
├── showToast() [UI feedback]
├── apiHelpers error wrapping
└── Component-level try/catch

Caching
├── performanceCache.ts
├── cacheUtils.ts
├── queryClient.ts (React Query)
├── useOptimizedMatches() [hook-level cache]
└── Services: invalidateMatchCache()

Translation/i18n
├── /src/lib/translations.ts (40KB file)
├── Used in: All components, hooks, API responses
└── Type-safe translation keys

Types & Validation
├── /src/types/ (organized by entity)
├── Zod schemas in hooks
└── Auto-generated enum exports
```

---

## 11. TESTING & QUALITY ASSURANCE

### 11.1 Current Test Files (5 total)
```
- Component tests (.test.tsx)
- Hook tests (.test.ts)
- Limited coverage (5 files for 732 total)
```

### 11.2 Recommended Test Structure

```
/src/test/
├── unit/
│   ├── hooks/
│   ├── utils/
│   └── queries/
├── integration/
│   ├── api-routes.test.ts
│   └── full-flows.test.ts
└── e2e/
    └── ...
```

---

## 12. SUMMARY & RECOMMENDATIONS

### What's Working Well:
1. Clean 3-tier layer separation
2. Consistent hook naming convention
3. Type-safe API route constants
4. Reusable auth wrappers
5. Service layer for complex queries
6. Well-documented patterns in README files

### What Could Improve:
1. Consolidate hardcoded Supabase queries into dedicated query layer
2. Standardize API response formats across all routes
3. Create factory functions for common hook patterns
4. Centralize validation schemas
5. Group components by business domain/feature
6. Increase test coverage
7. Consider repository pattern for data access
8. Document data flow with diagrams (currently implicit)

### Priority Refactoring Items:
1. **Extract Query Layer** → Single source of truth for all DB queries
2. **Standardize API Responses** → Consistent error handling & response format
3. **Create Hook Factories** → Reduce code duplication across data fetching hooks
4. **Organize by Domain** → Better component/feature grouping
5. **Validation Schemas** → Centralized, reusable validation
