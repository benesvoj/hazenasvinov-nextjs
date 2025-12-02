# 4-Layer Architecture Refactoring Plan
## HazenaSvinov Next.js Application

**Document Version:** 1.0
**Created:** November 12, 2025
**Status:** Planning Phase
**Estimated Total Effort:** 180-240 hours

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [4-Layer Architecture Definition](#4-layer-architecture-definition)
3. [Current vs Target Architecture](#current-vs-target-architecture)
4. [Refactoring Strategy](#refactoring-strategy)
5. [Component Inventory with Complexity & Priority](#component-inventory-with-complexity--priority)
6. [Phase-by-Phase Implementation Plan](#phase-by-phase-implementation-plan)
7. [Technical Implementation Guidelines](#technical-implementation-guidelines)
8. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
9. [Success Metrics](#success-metrics)
10. [Appendix: Detailed File Mappings](#appendix-detailed-file-mappings)

---

## Executive Summary

### Current State
- **Architecture:** 3-tier (Components → Hooks → API Routes → Database)
- **Total Files:** 732 TypeScript/TSX files
- **Hardcoded Queries:** 54 API routes + 38+ hooks with direct Supabase/fetch calls
- **Architecture Quality:** 8/10 (good foundation, needs consolidation)

### Target State
- **Architecture:** 4-layer (Presentation → Application → Domain → Infrastructure)
- **Query Consolidation:** Centralized data access layer
- **Code Reusability:** 50% reduction in duplicate code
- **Testability:** Increase coverage from 5 files to 200+ files
- **Maintainability:** Clear separation of concerns across all layers

### Key Benefits
1. **Single Source of Truth:** All database queries in one place
2. **Improved Testability:** Each layer can be tested independently
3. **Better Code Reuse:** Shared business logic and data access
4. **Easier Maintenance:** Clear boundaries between layers
5. **Future-Proof:** Easy to swap databases or add new features

---

## 4-Layer Architecture Definition

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: PRESENTATION                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Pages (src/app/**/page.tsx)                              │  │
│  │  - Route handlers                                         │  │
│  │  - Layout components                                      │  │
│  │  - Server/Client component coordination                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Components (src/components/**)                           │  │
│  │  - UI Components (buttons, forms, modals)                 │  │
│  │  - Feature Components (betting, lineups, attendance)      │  │
│  │  - Shared Components (member cards, match displays)       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  RESPONSIBILITIES:                                                │
│  - Render UI                                                      │
│  - Handle user interactions                                       │
│  - Call application layer hooks                                   │
│  - Display loading/error states                                   │
│                                                                   │
│  RESTRICTIONS:                                                    │
│  - NO direct API calls                                            │
│  - NO business logic                                              │
│  - NO database queries                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 2: APPLICATION                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Hooks (src/hooks/**)                                      │  │
│  │  - Data Fetching Hooks (useFetch*)                        │  │
│  │  - State Management Hooks (use*)                          │  │
│  │  - Business Logic Hooks (use*Business)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Contexts (src/contexts/**)                               │  │
│  │  - Global state management                                │  │
│  │  - User authentication context                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  RESPONSIBILITIES:                                                │
│  - Coordinate between presentation and domain layers              │
│  - Manage client-side state (loading, errors, data)              │
│  - Call domain services for business operations                   │
│  - Transform data for UI consumption                              │
│  - Handle side effects (toasts, redirects)                        │
│                                                                   │
│  RESTRICTIONS:                                                    │
│  - NO direct database queries                                     │
│  - Minimal business logic (delegate to domain layer)              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 3: DOMAIN                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Services (src/services/**)                                │  │
│  │  - Business logic implementation                          │  │
│  │  - Complex operations (betting odds, lineup management)   │  │
│  │  - Data transformation & validation                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Use Cases (src/use-cases/**) [NEW]                       │  │
│  │  - Orchestrate multi-step operations                      │  │
│  │  - Coordinate between multiple repositories               │  │
│  │  - Transaction management                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Validation (src/validation/**) [NEW]                     │  │
│  │  - Zod schemas for all entities                           │  │
│  │  - Business rule validation                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API Routes (src/app/api/**/route.ts)                     │  │
│  │  - HTTP request/response handling                         │  │
│  │  - Authentication/Authorization                           │  │
│  │  - Call domain services and repositories                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  RESPONSIBILITIES:                                                │
│  - Implement business logic and rules                             │
│  - Coordinate repository operations                               │
│  - Validate business constraints                                  │
│  - Transform domain entities                                      │
│                                                                   │
│  RESTRICTIONS:                                                    │
│  - NO direct database access (use repositories)                   │
│  - NO UI concerns (loading states, toasts)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 4: INFRASTRUCTURE                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Repositories (src/repositories/**) [NEW]                  │  │
│  │  - Data access abstraction                                │  │
│  │  - CRUD operations for each entity                        │  │
│  │  - Query building & execution                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Queries (src/queries/**) [NEW]                            │  │
│  │  - Raw query definitions                                   │  │
│  │  - Complex joins & aggregations                           │  │
│  │  - Reusable query fragments                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Database Clients (src/utils/supabase/**)                 │  │
│  │  - Supabase client instances                              │  │
│  │  - Connection management                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Cache Layer (src/lib/cache/**)                            │  │
│  │  - React Query configuration                              │  │
│  │  - Cache invalidation strategies                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  RESPONSIBILITIES:                                                │
│  - Execute database queries                                       │
│  - Handle database connections                                    │
│  - Implement caching strategies                                   │
│  - Map database rows to domain entities                           │
│                                                                   │
│  RESTRICTIONS:                                                    │
│  - NO business logic                                              │
│  - NO UI concerns                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Layer 1: Presentation Layer

**Location:**
- `/src/app/**/page.tsx` - Page components
- `/src/components/**` - UI and feature components

**Current Files:** ~200 component files

**Responsibilities:**
1. Render UI based on props and state
2. Handle user interactions (clicks, form submissions)
3. Call application layer hooks for data and operations
4. Display loading, error, and success states
5. Client-side routing and navigation

**Key Patterns:**
```typescript
// Page Component Example
'use client';

export default function MembersPage() {
  // Application layer hooks only
  const { data: members, loading, error } = useFetchMembers();
  const { createMember, updateMember, deleteMember } = useMembers();

  // UI rendering and event handling
  return (
    <MembersTable
      members={members}
      onEdit={updateMember}
      onDelete={deleteMember}
    />
  );
}
```

**Files to Modify:** All page.tsx and component files (clean up any direct fetch calls)

---

### Layer 2: Application Layer

**Location:**
- `/src/hooks/**` - Custom hooks
- `/src/contexts/**` - React contexts

**Current Files:** 120+ hooks, 5+ contexts

**Responsibilities:**
1. Coordinate between UI and domain layers
2. Manage client-side state (React state, loading, errors)
3. Call domain services and repositories via API routes
4. Transform data for UI consumption
5. Handle side effects (toasts, logging, analytics)

**Key Patterns:**
```typescript
// Data Fetching Hook (calls domain layer)
export function useFetchMembers() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Calls API route (domain layer)
      const response = await fetch(API_ROUTES.members.root);
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);
      setData(result.data);
    } catch (err) {
      setError(err.message);
      showToast.danger('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// CRUD Hook (calls domain layer)
export function useMembers() {
  const createMember = useCallback(async (formData: MemberFormData) => {
    // Validation happens in domain layer
    const response = await fetch(API_ROUTES.members.root, {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error('Failed to create member');
    return response.json();
  }, []);

  return { createMember, updateMember, deleteMember };
}
```

**Files to Modify:**
- All hooks in `/src/hooks/entities/*/data/` (38+ files)
- All hooks in `/src/hooks/entities/*/state/` (30+ files)
- Clean up any direct Supabase calls

---

### Layer 3: Domain Layer

**Location:**
- `/src/services/**` - Business logic services
- `/src/use-cases/**` - [NEW] Multi-step operations
- `/src/validation/**` - [NEW] Validation schemas
- `/src/app/api/**/route.ts` - API route handlers

**Current Files:** 54 API routes, 2 service files

**Responsibilities:**
1. Implement business logic and rules
2. Coordinate repository operations
3. Validate input data (Zod schemas)
4. Transform domain entities
5. Handle authentication & authorization
6. Return standardized responses

**Key Patterns:**

**API Route Handler:**
```typescript
// src/app/api/members/route.ts
import { withAuth, successResponse, errorResponse } from '@/utils/supabase/apiHelpers';
import { memberRepository } from '@/repositories/memberRepository';
import { createMemberSchema } from '@/validation/members';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    // Call repository (infrastructure layer)
    const members = await memberRepository.findAll();

    // Return standardized response
    return successResponse(members);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    const body = await request.json();

    // Validate using domain schema
    const validation = createMemberSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse('Invalid member data', 400, validation.error);
    }

    // Call repository
    const member = await memberRepository.create(validation.data);

    return successResponse(member, 201);
  });
}
```

**Service Layer:**
```typescript
// src/services/memberService.ts
import { memberRepository } from '@/repositories/memberRepository';
import { memberPaymentRepository } from '@/repositories/memberPaymentRepository';

export class MemberService {
  /**
   * Business logic: Calculate member status based on payments
   */
  async getMemberWithStatus(memberId: string) {
    const member = await memberRepository.findById(memberId);
    const payments = await memberPaymentRepository.findByMemberId(memberId);

    // Business rule: Member is active if payment within 12 months
    const lastPayment = payments[0];
    const isActive = lastPayment &&
      (new Date().getTime() - new Date(lastPayment.date).getTime()) < 365 * 24 * 60 * 60 * 1000;

    return {
      ...member,
      status: isActive ? 'active' : 'inactive',
      lastPaymentDate: lastPayment?.date,
    };
  }
}
```

**Use Case (Multi-step operation):**
```typescript
// src/use-cases/createMemberWithPayment.ts
import { memberRepository } from '@/repositories/memberRepository';
import { memberPaymentRepository } from '@/repositories/memberPaymentRepository';
import { supabase } from '@/utils/supabase/admin';

export async function createMemberWithPayment(
  memberData: MemberFormData,
  paymentData: PaymentData
) {
  // Start transaction
  const { data, error } = await supabase.rpc('begin_transaction');

  try {
    // Step 1: Create member
    const member = await memberRepository.create(memberData);

    // Step 2: Create payment
    const payment = await memberPaymentRepository.create({
      ...paymentData,
      member_id: member.id,
    });

    // Step 3: Send welcome email (could be another service)
    await emailService.sendWelcomeEmail(member.email);

    await supabase.rpc('commit_transaction');

    return { member, payment };
  } catch (error) {
    await supabase.rpc('rollback_transaction');
    throw error;
  }
}
```

**Files to Create:**
- `/src/validation/members.ts`
- `/src/validation/categories.ts`
- `/src/validation/matches.ts`
- `/src/validation/index.ts`
- `/src/use-cases/createMemberWithPayment.ts`
- `/src/use-cases/updateMatchLineup.ts`
- (10-15 use case files)

**Files to Modify:**
- All 54 API routes in `/src/app/api/**/route.ts`
- Move validation logic from hooks to validation schemas
- Update to use repositories instead of direct Supabase calls

---

### Layer 4: Infrastructure Layer

**Location:**
- `/src/repositories/**` - [NEW] Data access layer
- `/src/queries/**` - [NEW] Raw query definitions
- `/src/utils/supabase/**` - Database clients
- `/src/lib/cache/**` - Caching strategies

**Current Files:** 3 Supabase client files, 2 cache files

**Responsibilities:**
1. Execute database queries
2. Handle database connections
3. Map database rows to domain entities
4. Implement caching strategies
5. Query building and optimization

**Key Patterns:**

**Repository Pattern:**
```typescript
// src/repositories/memberRepository.ts
import { createServerClient } from '@/utils/supabase/server';
import { Member, MemberInsert, MemberUpdate } from '@/types/member';
import { memberQueries } from '@/queries/memberQueries';

export class MemberRepository {
  private supabase = createServerClient();

  async findAll(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select(memberQueries.SELECT_ALL)
      .order('surname', { ascending: true });

    if (error) throw new Error(`Failed to fetch members: ${error.message}`);
    return data || [];
  }

  async findById(id: string): Promise<Member | null> {
    const { data, error } = await this.supabase
      .from('members')
      .select(memberQueries.SELECT_WITH_RELATIONSHIPS)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch member: ${error.message}`);
    }

    return data;
  }

  async create(member: MemberInsert): Promise<Member> {
    const { data, error } = await this.supabase
      .from('members')
      .insert(member)
      .select()
      .single();

    if (error) throw new Error(`Failed to create member: ${error.message}`);
    return data;
  }

  async update(id: string, updates: MemberUpdate): Promise<Member> {
    const { data, error } = await this.supabase
      .from('members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update member: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('members')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete member: ${error.message}`);
  }

  // Complex queries
  async findInternalMembers(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select(memberQueries.SELECT_WITH_PAYMENTS)
      .eq('is_external', false)
      .order('surname', { ascending: true });

    if (error) throw new Error(`Failed to fetch internal members: ${error.message}`);
    return data || [];
  }

  async findByCategory(categoryId: string): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select(memberQueries.SELECT_ALL)
      .eq('category_id', categoryId);

    if (error) throw new Error(`Failed to fetch members by category: ${error.message}`);
    return data || [];
  }
}

// Export singleton instance
export const memberRepository = new MemberRepository();
```

**Query Definitions:**
```typescript
// src/queries/memberQueries.ts
export const memberQueries = {
  // Base select for all member queries
  SELECT_ALL: `
    id,
    name,
    surname,
    registration_number,
    birth_date,
    email,
    phone,
    is_external,
    status,
    created_at,
    updated_at
  `,

  // Select with relationships
  SELECT_WITH_RELATIONSHIPS: `
    *,
    category:categories(id, name, description),
    functions:member_functions(
      id,
      function_type,
      start_date,
      end_date
    ),
    club_relationships:member_club_relationships(
      id,
      club:clubs(id, name, short_name)
    )
  `,

  // Select with payments for financial tracking
  SELECT_WITH_PAYMENTS: `
    *,
    payments:member_payments(
      id,
      amount,
      payment_date,
      payment_type
    )
  `,
};

// Complex query builders
export const buildMemberSearchQuery = (supabase, filters: MemberSearchFilters) => {
  let query = supabase
    .from('members')
    .select(memberQueries.SELECT_ALL);

  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,surname.ilike.%${filters.search}%`);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.isExternal !== undefined) {
    query = query.eq('is_external', filters.isExternal);
  }

  return query;
};
```

**Repository Index:**
```typescript
// src/repositories/index.ts
export { memberRepository } from './memberRepository';
export { categoryRepository } from './categoryRepository';
export { matchRepository } from './matchRepository';
export { teamRepository } from './teamRepository';
export { clubRepository } from './clubRepository';
export { blogRepository } from './blogRepository';
export { userRepository } from './userRepository';
// ... export all repositories
```

**Files to Create:**
- `/src/repositories/memberRepository.ts`
- `/src/repositories/categoryRepository.ts`
- `/src/repositories/matchRepository.ts`
- `/src/repositories/teamRepository.ts`
- `/src/repositories/clubRepository.ts`
- `/src/repositories/blogRepository.ts`
- `/src/repositories/seasonRepository.ts`
- `/src/repositories/lineupRepository.ts`
- `/src/repositories/attendanceRepository.ts`
- `/src/repositories/bettingRepository.ts`
- `/src/repositories/userRepository.ts`
- `/src/repositories/index.ts`
- `/src/queries/memberQueries.ts`
- `/src/queries/categoryQueries.ts`
- `/src/queries/matchQueries.ts`
- (25-30 total repository + query files)

---

## Current vs Target Architecture

### Current Architecture (3-Tier)

```
Component/Page
    ↓ (uses hook)
Hook (useFetchMembers)
    ↓ (fetch API_ROUTES.members.root)
API Route (/api/members/route.ts)
    ↓ (direct Supabase query)
Database (supabase.from('members').select('*'))
```

**Problems:**
1. Hardcoded queries in 54 API routes
2. Duplicate query logic across routes
3. No centralized validation
4. Hard to test (tightly coupled layers)
5. Business logic scattered between hooks and API routes

---

### Target Architecture (4-Layer)

```
Page/Component (Presentation)
    ↓ (uses hook)
Hook (Application)
    ↓ (fetch API_ROUTES.members.root)
API Route (Domain)
    ↓ (calls service/repository)
Service/Use Case (Domain)
    ↓ (calls repository)
Repository (Infrastructure)
    ↓ (executes query)
Database Query (Infrastructure)
```

**Benefits:**
1. Single source of truth for queries (repositories)
2. Reusable business logic (services/use cases)
3. Centralized validation (domain layer)
4. Easy to test (each layer independent)
5. Clear separation of concerns

---

## Refactoring Strategy

### Approach: Incremental Migration (Bottom-Up)

We'll refactor from the bottom (infrastructure) up to the top (presentation), ensuring each layer is stable before moving to the next.

### Migration Phases

**Phase 1: Foundation (Infrastructure Layer)**
- Create repository structure
- Extract all queries to query files
- Implement base repositories for core entities

**Phase 2: Domain Logic (Domain Layer)**
- Create validation schemas
- Extract business logic to services
- Implement use cases for complex operations
- Update API routes to use repositories

**Phase 3: Application Integration (Application Layer)**
- Update hooks to use new API responses
- Remove any direct Supabase calls from hooks
- Standardize error handling

**Phase 4: Presentation Polish (Presentation Layer)**
- Update components to use refactored hooks
- Ensure no direct API calls in components
- Add proper loading/error states

**Phase 5: Testing & Documentation**
- Add unit tests for repositories
- Add integration tests for services
- Document all layers and patterns

---

## Component Inventory with Complexity & Priority

### Complexity Rating Scale

- **Low (L):** Simple CRUD, single entity, < 100 lines
- **Medium (M):** Multiple entities, some business logic, 100-300 lines
- **High (H):** Complex logic, many dependencies, > 300 lines
- **Critical (C):** Core functionality, high risk, requires careful refactoring

### Priority Rating Scale

- **P1 - Critical:** Core features, high traffic, blocking dependencies
- **P2 - High:** Important features, moderate traffic, some dependencies
- **P3 - Medium:** Nice to have, low traffic, minimal dependencies
- **P4 - Low:** Edge cases, rarely used, no dependencies

---

### Entity: Members

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Admin Members Page | `/src/app/admin/members/page.tsx` | **H** | **P1** | 8h | Core admin feature, multiple hooks |
| Coaches Members Page | `/src/app/coaches/members/page.tsx` | **M** | **P2** | 4h | Similar to admin but limited access |
| MembersTable Component | `/src/components/shared/member/*` | **H** | **P1** | 6h | Complex table with filters, sorting |
| Member Import | `/src/components/features/member-import/*` | **H** | **P2** | 8h | Bulk operations, validation |
| Member Relationships | `/src/components/features/member-relationships/*` | **M** | **P3** | 4h | Relationship management |
| useFetchMembers | `/src/hooks/entities/member/data/useFetchMembers.ts` | **L** | **P1** | 2h | Simple fetch hook |
| useFetchMembersInternal | `/src/hooks/entities/member/data/useFetchMembersInternal.ts` | **M** | **P1** | 4h | Pagination, filtering |
| useFetchMembersExternal | `/src/hooks/entities/member/data/useFetchMembersExternal.ts` | **M** | **P2** | 4h | Similar to internal |
| useMembers (CRUD) | `/src/hooks/entities/member/state/useMembers.ts` | **M** | **P1** | 4h | Create, update, delete |
| useMemberMetadata | `/src/hooks/entities/member/business/*` | **M** | **P3** | 3h | Business logic |
| useBulkEditMembers | `/src/hooks/entities/member/business/*` | **H** | **P2** | 6h | Complex bulk operations |
| API: GET /api/members | `/src/app/api/members/route.ts` | **M** | **P1** | 3h | Main members endpoint |
| API: POST /api/members | `/src/app/api/members/route.ts` | **M** | **P1** | 3h | Create member |
| API: GET /api/members/[id] | `/src/app/api/members/[id]/route.ts` | **L** | **P1** | 2h | Get single member |
| API: PUT /api/members/[id] | `/src/app/api/members/[id]/route.ts` | **M** | **P1** | 3h | Update member |
| API: DELETE /api/members/[id] | `/src/app/api/members/[id]/route.ts` | **L** | **P1** | 2h | Delete member |
| API: /api/members/internal | `/src/app/api/members/internal/route.ts` | **M** | **P1** | 3h | Internal members |
| API: /api/members/external | `/src/app/api/members/external/route.ts` | **M** | **P2** | 3h | External members |

**Members Subtotal:** ~68 hours

---

### Entity: Matches

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Public Matches Page | `/src/app/(main)/matches/page.tsx` | **H** | **P1** | 6h | High traffic, complex filters |
| Match Detail Page | `/src/app/(main)/matches/[id]/page.tsx` | **H** | **P1** | 8h | Complex data (lineups, stats, videos) |
| Admin Matches Page | `/src/app/admin/matches/page.tsx` | **C** | **P1** | 10h | Most complex page, many features |
| Coaches Matches Page | `/src/app/coaches/matches/page.tsx` | **H** | **P2** | 6h | Similar to admin but limited |
| MatchSchedule Component | `/src/components/shared/match/*` | **H** | **P1** | 8h | Complex display logic |
| MatchCard Component | `/src/components/shared/match/*` | **M** | **P1** | 4h | Reusable match display |
| useFetchMatches | `/src/hooks/entities/match/data/*` | **C** | **P1** | 8h | Most complex hook, many filters |
| useOptimizedMatches | `/src/hooks/entities/match/data/*` | **H** | **P1** | 6h | Cached version with optimization |
| useMatchQueries | `/src/hooks/entities/match/data/*` | **H** | **P1** | 6h | Query builder pattern |
| matchQueries.ts (service) | `/src/services/matchQueries.ts` | **C** | **P1** | 12h | 240+ lines, complex joins |
| optimizedMatchQueries.ts | `/src/services/optimizedMatchQueries.ts` | **H** | **P1** | 8h | Performance optimization |
| matchQueryBuilder.ts | `/src/utils/matchQueryBuilder.ts` | **H** | **P1** | 6h | Flexible query construction |
| API: GET /api/matches | `/src/app/api/matches/route.ts` | **H** | **P1** | 4h | Complex filtering |
| API: POST /api/matches | `/src/app/api/matches/route.ts` | **M** | **P1** | 4h | Create match |
| API: GET /api/matches/[id] | `/src/app/api/matches/[id]/route.ts` | **M** | **P1** | 3h | Single match |
| API: PUT /api/matches/[id] | `/src/app/api/matches/[id]/route.ts` | **M** | **P1** | 4h | Update match |

**Matches Subtotal:** ~103 hours

---

### Entity: Categories

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Public Category Page | `/src/app/(main)/categories/[slug]/page.tsx` | **H** | **P1** | 8h | High traffic, standings, matches |
| Admin Categories Page | `/src/app/admin/categories/page.tsx` | **M** | **P2** | 4h | Simple CRUD |
| useFetchCategories | `/src/hooks/entities/category/data/*` | **L** | **P1** | 2h | Simple fetch |
| useCategories (CRUD) | `/src/hooks/entities/category/state/*` | **M** | **P2** | 3h | CRUD operations |
| useCategoryPageData | `/src/hooks/entities/category/business/*` | **H** | **P1** | 6h | Complex business logic |
| useCategoryLineups | `/src/hooks/entities/category/business/*` | **M** | **P2** | 4h | Lineup management |
| API: /api/categories | `/src/app/api/categories/route.ts` | **L** | **P1** | 2h | Simple CRUD |

**Categories Subtotal:** ~29 hours

---

### Entity: Lineups (Coaches Portal)

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Coaches Lineups Page | `/src/app/coaches/lineups/page.tsx` | **C** | **P1** | 12h | Most complex coaches feature |
| LineupManager Component | `/src/components/features/lineup/*` | **C** | **P1** | 10h | Drag-drop, complex state |
| useLineupData | `/src/hooks/entities/lineup/data/*` | **H** | **P1** | 6h | Complex data fetching |
| useLineupManager | `/src/hooks/entities/lineup/state/*` | **C** | **P1** | 8h | Complex state management |
| useMatchLineupStats | `/src/hooks/entities/lineup/business/*` | **H** | **P2** | 6h | Statistics calculation |
| API: /api/lineups | `/src/app/api/lineups/route.ts` | **M** | **P1** | 4h | CRUD + validation |

**Lineups Subtotal:** ~46 hours

---

### Entity: Attendance (Coaches Portal)

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Coaches Attendance Page | `/src/app/coaches/attendance/page.tsx` | **H** | **P2** | 8h | Calendar view, bulk operations |
| Attendance Components | `/src/components/features/attendance/*` | **M** | **P2** | 6h | Calendar, lists |
| useAttendance | `/src/hooks/entities/attendance/*` | **M** | **P2** | 4h | Fetch and CRUD |
| API: /api/attendance | `/src/app/api/attendance/route.ts` | **M** | **P2** | 3h | CRUD operations |

**Attendance Subtotal:** ~21 hours

---

### Entity: Betting

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Public Betting Page | `/src/app/(betting)/betting/page.tsx` | **H** | **P2** | 8h | Complex UI, many features |
| Admin Generate Odds | `/src/app/admin/betting/generate-odds/page.tsx` | **H** | **P2** | 6h | Complex calculations |
| Betting Components | `/src/components/features/betting/*` | **H** | **P2** | 10h | 8 files, complex interactions |
| useBetting | `/src/hooks/entities/betting/*` | **H** | **P2** | 8h | Complex logic |
| bettingService.ts | `/src/services/bettingService.ts` | **H** | **P2** | 8h | Odds calculation, wallet |
| API: /api/betting/* | `/src/app/api/betting/*` | **H** | **P2** | 8h | Multiple endpoints |

**Betting Subtotal:** ~48 hours

---

### Entity: Blog

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Public Blog List | `/src/app/(main)/blog/page.tsx` | **M** | **P2** | 4h | List with pagination |
| Public Blog Post | `/src/app/(main)/blog/[slug]/page.tsx` | **M** | **P2** | 4h | Single post display |
| Admin Posts Page | `/src/app/admin/posts/page.tsx` | **M** | **P2** | 4h | CRUD interface |
| useFetchBlog | `/src/hooks/entities/blog/data/*` | **L** | **P2** | 2h | Simple fetch |
| useBlog (CRUD) | `/src/hooks/entities/blog/state/*` | **M** | **P2** | 3h | CRUD operations |
| API: /api/blog | `/src/app/api/blog/route.ts` | **L** | **P2** | 2h | Simple CRUD |

**Blog Subtotal:** ~19 hours

---

### Entity: Teams & Clubs

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Admin Clubs Page | `/src/app/admin/clubs/page.tsx` | **M** | **P2** | 4h | List + CRUD |
| Admin Club Detail | `/src/app/admin/clubs/[id]/page.tsx` | **H** | **P2** | 6h | Complex relationships |
| Admin New Club | `/src/app/admin/clubs/new/page.tsx` | **M** | **P2** | 4h | Form with validation |
| Admin Club Categories | `/src/app/admin/club-categories/page.tsx` | **M** | **P3** | 4h | Relationship management |
| useTeams | `/src/hooks/entities/team/*` | **M** | **P2** | 3h | CRUD operations |
| useClubs | `/src/hooks/entities/club/*` | **M** | **P2** | 3h | CRUD operations |
| API: /api/teams | `/src/app/api/teams/route.ts` | **L** | **P2** | 2h | Simple CRUD |
| API: /api/clubs | `/src/app/api/clubs/route.ts` | **M** | **P2** | 3h | CRUD with relationships |

**Teams & Clubs Subtotal:** ~29 hours

---

### Entity: Users & Auth

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Login Page | `/src/app/login/page.tsx` | **M** | **P1** | 4h | Auth flow |
| Coaches Login | `/src/app/coaches/login/page.tsx` | **M** | **P1** | 4h | Separate auth |
| Admin Users Page | `/src/app/admin/users/page.tsx` | **M** | **P1** | 4h | User management |
| Admin User Roles | `/src/app/admin/user-roles/page.tsx` | **M** | **P2** | 4h | Role management |
| Reset Password | `/src/app/reset-password/page.tsx` | **M** | **P2** | 3h | Password reset flow |
| Set Password | `/src/app/set-password/page.tsx` | **M** | **P2** | 3h | Password set flow |
| Auth Callback | `/src/app/auth/callback/page.tsx` | **M** | **P1** | 3h | OAuth callback |
| useAuth / useAuthNew | `/src/hooks/entities/auth/*` | **H** | **P1** | 6h | Complex auth state |
| Middleware (proxy.ts) | `/src/proxy.ts` | **H** | **P1** | 6h | Authentication middleware |
| API: /api/users | `/src/app/api/users/route.ts` | **M** | **P1** | 3h | User CRUD |

**Users & Auth Subtotal:** ~40 hours

---

### Other Pages & Features

| Component/Page | File | Complexity | Priority | Est. Hours | Notes |
|----------------|------|------------|----------|------------|-------|
| Home Page | `/src/app/(main)/page.tsx` | **M** | **P1** | 4h | High traffic |
| About Page | `/src/app/(main)/about/page.tsx` | **L** | **P3** | 1h | Static content |
| Contact Page | `/src/app/(main)/contact/page.tsx` | **L** | **P3** | 2h | Contact form |
| Photo Gallery | `/src/app/(main)/photo-gallery/page.tsx` | **M** | **P3** | 4h | Image display |
| Admin Photo Gallery | `/src/app/admin/photo-gallery/page.tsx` | **M** | **P3** | 4h | Upload & management |
| Downloads | `/src/app/(main)/downloads/page.tsx` | **L** | **P3** | 2h | File listing |
| Chronicle | `/src/app/(main)/chronicle/page.tsx` | **L** | **P3** | 2h | Historical content |
| Celebration/100 | `/src/app/(main)/celebration/page.tsx` | **L** | **P4** | 1h | Special pages |
| Admin Dashboard | `/src/app/admin/page.tsx` | **M** | **P2** | 4h | Stats dashboard |
| Coaches Dashboard | `/src/app/coaches/dashboard/page.tsx` | **M** | **P2** | 4h | Stats dashboard |
| Coaches Statistics | `/src/app/coaches/statistics/page.tsx` | **H** | **P2** | 6h | Complex calculations |
| Meeting Minutes (Admin) | `/src/app/admin/meeting-minutes/page.tsx` | **H** | **P2** | 6h | Complex form |
| Meeting Minutes (Coaches) | `/src/app/coaches/meeting-minutes/page.tsx` | **M** | **P2** | 4h | View only |
| MeetingMinutesContainer | `/src/components/features/meeting-minutes/*` | **H** | **P2** | 6h | Complex component |
| Admin Seasons | `/src/app/admin/seasons/page.tsx` | **M** | **P2** | 4h | Season management |
| Admin Videos | `/src/app/admin/videos/page.tsx` | **M** | **P2** | 4h | Video management |
| Coaches Videos | `/src/app/coaches/videos/page.tsx` | **L** | **P2** | 2h | Video listing |
| Admin Member Functions | `/src/app/admin/member-functions/page.tsx` | **M** | **P3** | 4h | Function assignment |
| Admin Committees | `/src/app/admin/committees/page.tsx` | **M** | **P3** | 4h | Committee management |
| Admin Club Config | `/src/app/admin/club-config/page.tsx` | **M** | **P3** | 4h | Configuration |
| Admin Sponsorship | `/src/app/admin/sponsorship/page.tsx` | **M** | **P3** | 4h | Sponsor management |
| Admin Grant Calendar | `/src/app/admin/grant-calendar/page.tsx` | **M** | **P3** | 4h | Calendar management |
| Blocked Page | `/src/app/blocked/page.tsx` | **L** | **P2** | 1h | Simple message |
| Error Page | `/src/app/error/page.tsx` | **L** | **P2** | 1h | Error handling |

**Other Features Subtotal:** ~82 hours

---

### Summary by Entity/Feature

| Entity/Feature | Total Hours | Priority | Complexity |
|----------------|-------------|----------|------------|
| **Members** | 68h | P1 | High |
| **Matches** | 103h | P1 | Critical |
| **Categories** | 29h | P1 | Medium |
| **Lineups** | 46h | P1 | Critical |
| **Attendance** | 21h | P2 | Medium |
| **Betting** | 48h | P2 | High |
| **Blog** | 19h | P2 | Low |
| **Teams & Clubs** | 29h | P2 | Medium |
| **Users & Auth** | 40h | P1 | High |
| **Other Features** | 82h | P2-P4 | Mixed |
| **TOTAL** | **485h** | - | - |

### Adjusted Realistic Estimate

The above is the detailed breakdown. When accounting for:
- Infrastructure setup (repositories, validation): 40h
- Testing & documentation: 60h
- Buffer for unexpected issues (20%): 115h

**Total Project Estimate: 700 hours** (17.5 weeks with 1 developer, or ~4 months)

However, using **incremental approach** and prioritizing:
- **Phase 1 (Core):** P1 items only = ~200 hours
- **Phase 2 (Important):** P2 items = ~180 hours
- **Phase 3 (Nice to have):** P3-P4 items = ~105 hours

---

## Phase-by-Phase Implementation Plan

### Phase 0: Preparation (Week 1) - 40 hours

**Goal:** Set up infrastructure and patterns

#### Tasks:
1. **Create directory structure** (2h)
   ```bash
   mkdir -p src/repositories
   mkdir -p src/queries
   mkdir -p src/validation
   mkdir -p src/use-cases
   ```

2. **Create base repository class** (4h)
   - Generic CRUD operations
   - Error handling patterns
   - Type-safe query building

3. **Create validation schema structure** (4h)
   - Set up Zod schema patterns
   - Create base validation utilities
   - Document validation rules

4. **Standardize API responses** (4h)
   - Create `ApiResponse<T>` type
   - Update `successResponse()` and `errorResponse()` helpers
   - Document response format

5. **Set up testing infrastructure** (8h)
   - Configure Jest/Vitest
   - Set up test database
   - Create test utilities and mocks
   - Write example tests

6. **Create migration documentation** (4h)
   - Step-by-step guide
   - Code examples
   - Checklist template

7. **Set up branch strategy** (2h)
   - Create `refactor/infrastructure` branch
   - Set up PR templates
   - Document Git workflow

8. **Create first example (Members)** (12h)
   - Complete members repository
   - Members validation schemas
   - Update 1 API route as example
   - Update 1 hook as example
   - Document the process

**Deliverables:**
- Directory structure created
- Base patterns documented
- First working example (Members)
- Testing infrastructure ready
- Team aligned on approach

---

### Phase 1: Core Infrastructure (Weeks 2-5) - 160 hours

**Goal:** Migrate P1 entities to 4-layer architecture

#### Focus Entities:
- Members (68h)
- Matches (103h)
- Categories (29h)
- Users & Auth (40h)

#### Week 2: Members (40h)

**Day 1-2: Repository Layer** (16h)
- [ ] Create `memberRepository.ts` with all CRUD methods
- [ ] Create `memberQueries.ts` with query definitions
- [ ] Create `memberPaymentRepository.ts`
- [ ] Create `memberFunctionRepository.ts`
- [ ] Write unit tests for repositories

**Day 3: Domain Layer** (8h)
- [ ] Create `src/validation/members.ts` with Zod schemas
- [ ] Extract business logic to `src/services/memberService.ts`
- [ ] Update API routes to use repositories:
  - [ ] `/api/members/route.ts` (GET, POST)
  - [ ] `/api/members/[id]/route.ts` (GET, PUT, DELETE)
  - [ ] `/api/members/internal/route.ts`
  - [ ] `/api/members/external/route.ts`

**Day 4: Application Layer** (8h)
- [ ] Update `useFetchMembers.ts`
- [ ] Update `useFetchMembersInternal.ts`
- [ ] Update `useFetchMembersExternal.ts`
- [ ] Update `useMembers.ts` (CRUD hook)
- [ ] Test all hooks

**Day 5: Testing & Documentation** (8h)
- [ ] Write integration tests for member flows
- [ ] Update component examples
- [ ] Document migration for team
- [ ] Code review and refinements

#### Week 3: Matches Part 1 (40h)

**Day 1-2: Repository & Queries** (16h)
- [ ] Create `matchRepository.ts`
- [ ] Migrate complex queries from `src/services/matchQueries.ts`
- [ ] Create `src/queries/matchQueries.ts`
- [ ] Create query builder utilities
- [ ] Write unit tests

**Day 3: Service Layer** (8h)
- [ ] Refactor `matchQueries.ts` to use repository
- [ ] Refactor `optimizedMatchQueries.ts`
- [ ] Extract match query builder logic
- [ ] Update cache invalidation

**Day 4: API Routes** (8h)
- [ ] Update `/api/matches/route.ts`
- [ ] Update `/api/matches/[id]/route.ts`
- [ ] Create validation schemas
- [ ] Test API endpoints

**Day 5: Hooks** (8h)
- [ ] Update `useFetchMatches.ts`
- [ ] Update `useOptimizedMatches.ts`
- [ ] Update `useMatchQueries.ts`
- [ ] Test hooks

#### Week 4: Matches Part 2 + Categories (40h)

**Day 1-2: Match Components** (16h)
- [ ] Update `MatchSchedule` component
- [ ] Update `MatchCard` component
- [ ] Update match detail page
- [ ] Update admin matches page
- [ ] Test all match displays

**Day 3: Categories Repository** (8h)
- [ ] Create `categoryRepository.ts`
- [ ] Create `src/queries/categoryQueries.ts`
- [ ] Update API routes
- [ ] Create validation schemas

**Day 4: Categories Application** (8h)
- [ ] Update `useFetchCategories.ts`
- [ ] Update `useCategories.ts`
- [ ] Update `useCategoryPageData.ts`
- [ ] Update category page

**Day 5: Testing** (8h)
- [ ] Integration tests for matches
- [ ] Integration tests for categories
- [ ] End-to-end testing
- [ ] Bug fixes

#### Week 5: Users & Auth (40h)

**Day 1: User Repository** (8h)
- [ ] Create `userRepository.ts`
- [ ] Create `userProfileRepository.ts`
- [ ] Update API routes
- [ ] Create validation schemas

**Day 2: Auth Refactoring** (8h)
- [ ] Update auth hooks (`useAuth`, `useAuthNew`)
- [ ] Update middleware (`proxy.ts`)
- [ ] Test authentication flows
- [ ] Test authorization

**Day 3-4: Auth Pages** (16h)
- [ ] Update login pages
- [ ] Update password reset flows
- [ ] Update admin user management
- [ ] Update role management
- [ ] Test all auth flows

**Day 5: Integration & Testing** (8h)
- [ ] Full authentication testing
- [ ] Security testing
- [ ] Performance testing
- [ ] Documentation

**Phase 1 Deliverables:**
- Members fully migrated ✓
- Matches fully migrated ✓
- Categories fully migrated ✓
- Users & Auth fully migrated ✓
- All P1 functionality working
- Test coverage > 60% for core features

---

### Phase 2: Important Features (Weeks 6-9) - 180 hours

**Goal:** Migrate P2 entities and features

#### Focus Entities:
- Lineups (46h)
- Betting (48h)
- Blog (19h)
- Teams & Clubs (29h)
- Attendance (21h)

#### Week 6: Lineups (46h)

**Day 1-2: Repository & Queries** (16h)
- [ ] Create `lineupRepository.ts`
- [ ] Create `lineupPlayerRepository.ts`
- [ ] Create complex query definitions
- [ ] Write unit tests

**Day 3: Service Layer** (10h)
- [ ] Create `lineupService.ts` for business logic
- [ ] Extract lineup validation rules
- [ ] Create use cases for complex operations
- [ ] Test services

**Day 4: API & Hooks** (12h)
- [ ] Update `/api/lineups` routes
- [ ] Update `useLineupData.ts`
- [ ] Update `useLineupManager.ts`
- [ ] Update `useMatchLineupStats.ts`

**Day 5: Components** (8h)
- [ ] Update `LineupManager` component
- [ ] Update coaches lineups page
- [ ] Test drag-drop functionality
- [ ] Integration testing

#### Week 7: Betting (48h)

**Day 1-2: Repository** (16h)
- [ ] Create `bettingRepository.ts`
- [ ] Create `bettingOddsRepository.ts`
- [ ] Create `bettingWalletRepository.ts`
- [ ] Write unit tests

**Day 3: Service Layer** (12h)
- [ ] Refactor `bettingService.ts` to use repositories
- [ ] Extract odds calculation logic
- [ ] Extract wallet management logic
- [ ] Create validation schemas

**Day 4: API & Hooks** (12h)
- [ ] Update `/api/betting/*` routes
- [ ] Update betting hooks
- [ ] Test betting flows

**Day 5: Components** (8h)
- [ ] Update betting page
- [ ] Update odds generation page
- [ ] Update betting components
- [ ] Integration testing

#### Week 8: Blog + Teams & Clubs (48h)

**Day 1: Blog Migration** (8h)
- [ ] Create `blogRepository.ts`
- [ ] Update API routes
- [ ] Update hooks
- [ ] Update pages

**Day 2-3: Teams & Clubs** (16h)
- [ ] Create `teamRepository.ts`
- [ ] Create `clubRepository.ts`
- [ ] Create `clubCategoryRepository.ts`
- [ ] Update all related API routes

**Day 4: Hooks & Pages** (12h)
- [ ] Update team/club hooks
- [ ] Update admin clubs pages
- [ ] Update club categories page
- [ ] Test relationships

**Day 5: Testing** (12h)
- [ ] Integration testing
- [ ] Bug fixes
- [ ] Documentation

#### Week 9: Attendance + Other (38h)

**Day 1-2: Attendance** (16h)
- [ ] Create `attendanceRepository.ts`
- [ ] Update API routes
- [ ] Update hooks
- [ ] Update coaches attendance page

**Day 3-4: Other Repositories** (16h)
- [ ] Create `seasonRepository.ts`
- [ ] Create `videoRepository.ts`
- [ ] Create `meetingMinutesRepository.ts`
- [ ] Update respective API routes

**Day 5: Integration** (6h)
- [ ] Full system testing
- [ ] Performance optimization
- [ ] Bug fixes

**Phase 2 Deliverables:**
- All P2 features migrated ✓
- Test coverage > 70%
- Performance benchmarks met
- Documentation updated

---

### Phase 3: Remaining Features (Weeks 10-12) - 105 hours

**Goal:** Complete migration of P3-P4 items

#### Week 10-11: Remaining Admin Features (70h)

- [ ] Photo gallery
- [ ] Downloads
- [ ] Sponsorship management
- [ ] Grant calendar
- [ ] Member functions
- [ ] Committees
- [ ] Club configuration

**Approach:** Similar pattern for each:
1. Create repository (4h each)
2. Update API routes (2h each)
3. Update hooks (2h each)
4. Update pages (3h each)
5. Testing (2h each)

#### Week 12: Polish & Optimization (35h)

**Day 1: Performance Optimization** (8h)
- [ ] Identify slow queries
- [ ] Add database indexes
- [ ] Optimize React Query cache
- [ ] Add request debouncing where needed

**Day 2: Error Handling** (8h)
- [ ] Standardize error messages
- [ ] Add error boundaries
- [ ] Improve user feedback
- [ ] Add logging

**Day 3: Documentation** (8h)
- [ ] Update all README files
- [ ] Create architecture diagrams
- [ ] Document best practices
- [ ] Create video walkthrough

**Day 4: Final Testing** (8h)
- [ ] Full regression testing
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security audit

**Day 5: Deployment Prep** (3h)
- [ ] Create deployment checklist
- [ ] Database migration scripts
- [ ] Rollback plan
- [ ] Monitoring setup

**Phase 3 Deliverables:**
- 100% feature migration complete ✓
- Test coverage > 80%
- Full documentation
- Ready for production

---

### Phase 4: Testing & Quality Assurance (Week 13) - 40 hours

**Goal:** Comprehensive testing and quality improvements

#### Week 13: Testing & QA (40h)

**Day 1: Unit Testing** (8h)
- [ ] Ensure all repositories have tests
- [ ] Ensure all services have tests
- [ ] Ensure all validation schemas have tests
- [ ] Achieve 80%+ unit test coverage

**Day 2: Integration Testing** (8h)
- [ ] Test all API routes
- [ ] Test all hooks
- [ ] Test critical user flows
- [ ] Test error scenarios

**Day 3: E2E Testing** (8h)
- [ ] Set up Playwright/Cypress
- [ ] Create tests for critical paths:
  - [ ] User registration & login
  - [ ] Create member
  - [ ] Schedule match
  - [ ] Create lineup
  - [ ] Place bet
- [ ] Run tests in CI/CD

**Day 4: Performance & Security** (8h)
- [ ] Load testing (identify bottlenecks)
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Accessibility audit
- [ ] SEO optimization

**Day 5: Final Polish** (8h)
- [ ] Fix all identified issues
- [ ] Code review with team
- [ ] Final documentation updates
- [ ] Prepare release notes

**Phase 4 Deliverables:**
- Test coverage > 80% ✓
- All critical bugs fixed ✓
- Performance benchmarks met ✓
- Security audit passed ✓
- Ready for production deployment ✓

---

## Technical Implementation Guidelines

### Repository Pattern Implementation

#### Base Repository Structure

```typescript
// src/repositories/BaseRepository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/utils/supabase/server';

export abstract class BaseRepository<T, TInsert = T, TUpdate = Partial<T>> {
  protected supabase: SupabaseClient;
  protected abstract tableName: string;
  protected abstract selectQuery: string;

  constructor(client?: SupabaseClient) {
    this.supabase = client || createServerClient();
  }

  async findAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(this.selectQuery);

    if (error) throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    return data || [];
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }

    return data;
  }

  async create(item: TInsert): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(item as any)
      .select(this.selectQuery)
      .single();

    if (error) throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    return data;
  }

  async update(id: string, updates: TUpdate): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates as any)
      .eq('id', id)
      .select(this.selectQuery)
      .single();

    if (error) throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
  }

  async count(filters?: Record<string, any>): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { count, error } = await query;

    if (error) throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    return count || 0;
  }
}
```

#### Example Entity Repository

```typescript
// src/repositories/memberRepository.ts
import { BaseRepository } from './BaseRepository';
import { Member, MemberInsert, MemberUpdate } from '@/types/member';
import { memberQueries } from '@/queries/memberQueries';

class MemberRepository extends BaseRepository<Member, MemberInsert, MemberUpdate> {
  protected tableName = 'members';
  protected selectQuery = memberQueries.SELECT_ALL;

  // Custom query methods
  async findInternal(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('is_external', false)
      .order('surname', { ascending: true });

    if (error) throw new Error(`Failed to fetch internal members: ${error.message}`);
    return data || [];
  }

  async findExternal(): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('is_external', true)
      .order('surname', { ascending: true });

    if (error) throw new Error(`Failed to fetch external members: ${error.message}`);
    return data || [];
  }

  async findByCategory(categoryId: string): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(this.selectQuery)
      .eq('category_id', categoryId);

    if (error) throw new Error(`Failed to fetch members by category: ${error.message}`);
    return data || [];
  }

  async search(filters: {
    search?: string;
    categoryId?: string;
    status?: string;
    isExternal?: boolean;
  }): Promise<Member[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(this.selectQuery);

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,surname.ilike.%${filters.search}%`);
    }

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.isExternal !== undefined) {
      query = query.eq('is_external', filters.isExternal);
    }

    const { data, error } = await query.order('surname', { ascending: true });

    if (error) throw new Error(`Failed to search members: ${error.message}`);
    return data || [];
  }
}

export const memberRepository = new MemberRepository();
```

---

### Validation Schema Pattern

```typescript
// src/validation/members.ts
import { z } from 'zod';

export const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  surname: z.string().min(1, 'Surname is required').max(100),
  registration_number: z.string().optional(),
  birth_date: z.string().datetime().optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  is_external: z.boolean().default(false),
  category_id: z.string().uuid('Invalid category ID').optional(),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
});

export const updateMemberSchema = createMemberSchema.partial();

export const bulkUpdateMembersSchema = z.object({
  member_ids: z.array(z.string().uuid()),
  updates: updateMemberSchema,
});

export type MemberFormData = z.infer<typeof createMemberSchema>;
export type MemberUpdateData = z.infer<typeof updateMemberSchema>;
```

---

### API Route Pattern

```typescript
// src/app/api/members/route.ts
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/utils/supabase/apiHelpers';
import { memberRepository } from '@/repositories/memberRepository';
import { createMemberSchema } from '@/validation/members';

export async function GET(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    try {
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const isExternal = searchParams.get('is_external');

      // Call repository
      let members;
      if (isExternal === 'true') {
        members = await memberRepository.findExternal();
      } else if (isExternal === 'false') {
        members = await memberRepository.findInternal();
      } else {
        members = await memberRepository.findAll();
      }

      return successResponse(members);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    try {
      const body = await request.json();

      // Validate
      const validation = createMemberSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Validation failed',
          400,
          validation.error.flatten()
        );
      }

      // Create via repository
      const member = await memberRepository.create(validation.data);

      return successResponse(member, 201);
    } catch (error) {
      return errorResponse(error.message, 500);
    }
  });
}
```

---

### Hook Pattern (No Changes Needed)

```typescript
// src/hooks/entities/member/data/useFetchMembers.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { API_ROUTES } from '@/lib/api-routes';
import { Member } from '@/types/member';
import { showToast } from '@/utils/toast';

export function useFetchMembers() {
  const [data, setData] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(API_ROUTES.members.root);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch members');
      }

      setData(result.data || []);
    } catch (err) {
      const message = err.message || 'Error fetching members';
      setError(message);
      showToast.danger(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

**Note:** Hooks remain largely unchanged. They just benefit from improved API responses and error handling.

---

### Testing Pattern

#### Repository Tests

```typescript
// src/repositories/__tests__/memberRepository.test.ts
import { memberRepository } from '../memberRepository';
import { createServerClient } from '@/utils/supabase/server';

// Mock Supabase
jest.mock('@/utils/supabase/server');

describe('MemberRepository', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('findAll', () => {
    it('should return all members', async () => {
      const mockMembers = [
        { id: '1', name: 'John', surname: 'Doe' },
        { id: '2', name: 'Jane', surname: 'Smith' },
      ];

      mockSupabase.select.mockResolvedValue({ data: mockMembers, error: null });

      const result = await memberRepository.findAll();

      expect(result).toEqual(mockMembers);
      expect(mockSupabase.from).toHaveBeenCalledWith('members');
    });

    it('should throw error on failure', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(memberRepository.findAll()).rejects.toThrow('Failed to fetch members');
    });
  });

  describe('create', () => {
    it('should create a member', async () => {
      const newMember = { name: 'John', surname: 'Doe' };
      const createdMember = { id: '1', ...newMember };

      mockSupabase.single.mockResolvedValue({ data: createdMember, error: null });

      const result = await memberRepository.create(newMember);

      expect(result).toEqual(createdMember);
      expect(mockSupabase.insert).toHaveBeenCalledWith(newMember);
    });
  });
});
```

#### API Route Tests

```typescript
// src/app/api/members/__tests__/route.test.ts
import { GET, POST } from '../route';
import { memberRepository } from '@/repositories/memberRepository';

jest.mock('@/repositories/memberRepository');

describe('/api/members', () => {
  describe('GET', () => {
    it('should return all members', async () => {
      const mockMembers = [{ id: '1', name: 'John' }];
      (memberRepository.findAll as jest.Mock).mockResolvedValue(mockMembers);

      const request = new Request('http://localhost:3000/api/members');
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.data).toEqual(mockMembers);
      expect(response.status).toBe(200);
    });
  });

  describe('POST', () => {
    it('should create a member', async () => {
      const newMember = { name: 'John', surname: 'Doe' };
      const createdMember = { id: '1', ...newMember };

      (memberRepository.create as jest.Mock).mockResolvedValue(createdMember);

      const request = new Request('http://localhost:3000/api/members', {
        method: 'POST',
        body: JSON.stringify(newMember),
      });

      const response = await POST(request as any);
      const data = await response.json();

      expect(data.data).toEqual(createdMember);
      expect(response.status).toBe(201);
    });
  });
});
```

---

## Risk Assessment & Mitigation

### High-Risk Areas

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| **Breaking existing functionality** | High | Medium | Incremental migration, feature flags, extensive testing |
| **Database performance degradation** | High | Low | Benchmark before/after, add indexes, optimize queries |
| **Authentication/authorization bugs** | Critical | Low | Prioritize auth testing, security audit |
| **Data loss during migration** | Critical | Very Low | Backup database, test on staging first |
| **Extended downtime** | Medium | Low | Blue-green deployment, rollback plan |
| **Team resistance to changes** | Medium | Medium | Clear documentation, training sessions, pair programming |
| **Scope creep** | Medium | High | Stick to plan, use feature flags for nice-to-haves |

### Mitigation Strategies

1. **Feature Flags**
   - Implement feature flags to toggle between old and new code
   - Gradual rollout to subset of users
   - Easy rollback if issues arise

2. **Comprehensive Testing**
   - Unit tests for all repositories and services
   - Integration tests for API routes
   - E2E tests for critical user flows
   - Performance benchmarks

3. **Staging Environment**
   - Test all changes on staging first
   - Mirror production data (anonymized)
   - Load testing on staging

4. **Incremental Deployment**
   - Deploy one entity at a time
   - Monitor metrics after each deployment
   - Rollback plan for each phase

5. **Documentation**
   - Document all patterns and decisions
   - Create video tutorials
   - Maintain changelog

6. **Code Reviews**
   - All changes reviewed by 2+ developers
   - Use PR templates with checklists
   - Pair programming for complex areas

---

## Success Metrics

### Technical Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Test Coverage** | ~5 files | 80%+ | Jest coverage report |
| **Code Duplication** | High | < 5% | SonarQube |
| **API Response Time (p95)** | Unknown | < 500ms | Application monitoring |
| **Build Time** | Unknown | < 3min | CI/CD metrics |
| **Bundle Size** | Unknown | Maintain or reduce | Webpack analyzer |
| **Lighthouse Score** | Unknown | > 90 | Lighthouse CI |

### Qualitative Metrics

- **Maintainability:** Easier to add new features (measure by time to add feature)
- **Developer Experience:** Faster onboarding for new developers
- **Code Clarity:** Reduced time to understand codebase
- **Bug Rate:** Fewer production bugs post-refactoring

### Business Metrics

- **Page Load Time:** Improved user experience
- **Error Rate:** Reduced user-facing errors
- **Uptime:** Maintain 99.9% uptime during migration
- **User Satisfaction:** No decrease in user satisfaction scores

---

## Appendix: Detailed File Mappings

### Current File Structure

```
/src
├── app/
│   ├── (main)/
│   │   ├── page.tsx
│   │   ├── blog/
│   │   ├── matches/
│   │   ├── categories/
│   │   └── ...
│   ├── admin/
│   │   ├── members/page.tsx
│   │   ├── matches/page.tsx
│   │   ├── categories/page.tsx
│   │   └── ...
│   ├── coaches/
│   │   ├── lineups/page.tsx
│   │   ├── attendance/page.tsx
│   │   └── ...
│   └── api/
│       ├── members/route.ts
│       ├── matches/route.ts
│       └── ...
├── components/
│   ├── features/
│   ├── shared/
│   └── ui/
├── hooks/
│   └── entities/
│       ├── member/
│       ├── match/
│       ├── category/
│       └── ...
├── services/
│   ├── matchQueries.ts
│   └── bettingService.ts
├── utils/
│   └── supabase/
│       ├── server.ts
│       ├── admin.ts
│       └── client.ts
└── types/
```

### Target File Structure

```
/src
├── app/ (unchanged)
├── components/ (unchanged)
├── hooks/ (unchanged, but updated internally)
├── repositories/ [NEW]
│   ├── BaseRepository.ts
│   ├── memberRepository.ts
│   ├── matchRepository.ts
│   ├── categoryRepository.ts
│   ├── teamRepository.ts
│   ├── clubRepository.ts
│   ├── blogRepository.ts
│   ├── lineupRepository.ts
│   ├── attendanceRepository.ts
│   ├── bettingRepository.ts
│   ├── userRepository.ts
│   └── index.ts
├── queries/ [NEW]
│   ├── memberQueries.ts
│   ├── matchQueries.ts
│   ├── categoryQueries.ts
│   └── ...
├── validation/ [NEW]
│   ├── members.ts
│   ├── matches.ts
│   ├── categories.ts
│   └── index.ts
├── use-cases/ [NEW]
│   ├── createMemberWithPayment.ts
│   ├── updateMatchLineup.ts
│   ├── generateBettingOdds.ts
│   └── ...
├── services/ (refactored to use repositories)
│   ├── memberService.ts
│   ├── matchService.ts
│   └── bettingService.ts
├── utils/ (unchanged)
└── types/ (unchanged)
```

---

## Conclusion

This refactoring plan provides a comprehensive roadmap to migrate the HazenaSvinov Next.js application from a 3-tier to a 4-layer architecture. The incremental, bottom-up approach minimizes risk while delivering immediate benefits.

### Key Takeaways

1. **Incremental Migration:** Migrate one entity at a time, starting with core features
2. **Bottom-Up Approach:** Build infrastructure first, then work up to presentation
3. **Comprehensive Testing:** Test at every layer to ensure quality
4. **Clear Patterns:** Establish patterns early and document them
5. **Team Alignment:** Keep team informed and trained throughout the process

### Next Steps

1. Review this plan with the team
2. Get stakeholder approval
3. Set up the development environment
4. Begin Phase 0 (Preparation)
5. Execute incrementally following the phase plan

### Estimated Timeline

- **Fast Track (1 developer):** 17-20 weeks
- **Balanced (2 developers):** 10-12 weeks
- **Aggressive (3 developers):** 7-8 weeks

### Questions?

Refer to:
- `CODEBASE_ARCHITECTURE_ANALYSIS.md` for current architecture details
- `ARCHITECTURE_ANALYSIS_INDEX.md` for quick reference
- This document for refactoring strategy

---

**Document End**

*Last Updated: November 12, 2025*
*Version: 1.0*
*Status: Ready for Review*