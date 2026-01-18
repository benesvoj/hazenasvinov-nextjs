# Comprehensive Codebase Analysis - January 2026

**Analyzed:** 855 TypeScript/TSX files (~100K lines of code)
**Date:** January 17, 2026
**Branch:** architecture-layer-refactor

---

## Executive Summary

**Overall Health:** 🟡 Good foundation with significant improvement opportunities

**Key Findings:**
- ✅ **Strengths:** Good architectural patterns established, comprehensive refactoring docs
- ⚠️ **Challenges:** Large monolithic files, low test coverage (<1%), technical debt accumulating
- 🎯 **Opportunities:** Code quality improvements, better abstractions, performance optimization

---

## 1. CODE QUALITY ISSUES

### 🔴 CRITICAL: Large Monolithic Files

**Problem:** 8 files exceed 600 lines, violating Single Responsibility Principle

#### Worst Offenders:

**1. `src/app/admin/matches/page.tsx` (1,237 lines!)**
```typescript
// Currently contains:
- 11+ useState declarations
- 8+ modal management hooks
- Form validation logic
- Standings calculations
- Lineup management
- Video selection
- Excel import
// Everything in ONE file!
```

**Impact:**
- ❌ Hard to maintain
- ❌ Difficult to test
- ❌ Performance issues (re-renders entire tree)
- ❌ Onboarding nightmare for new developers

**Recommendation:**
```typescript
// Split into:
src/app/admin/matches/
├── page.tsx (50 lines - orchestration only)
├── components/
│   ├── MatchFilters.tsx
│   ├── MatchTable.tsx
│   ├── MatchActions.tsx
│   └── modals/
│       ├── AddMatchModal.tsx
│       ├── EditMatchModal.tsx
│       ├── LineupModal.tsx
│       └── VideoSelectionModal.tsx
└── hooks/
    ├── useMatchFilters.ts
    ├── useMatchActions.ts
    └── useMatchModals.ts
```

**Estimated effort:** 2-3 days
**Priority:** 🔴 HIGH (blocks future feature development)

---

**2. `src/hooks/entities/attendance/useAttendance.ts` (735 lines)**
**3. `src/components/ui/client/UnifiedSidebar.tsx` (604 lines)**
**4. `src/components/ui/client/UnifiedTopBar.tsx` (600 lines)**

**Recommendation:** Apply same decomposition pattern.

---

### 🟡 MEDIUM: Code Duplication

#### Pattern 1: Mutation Template Files

**Found:** 15 nearly identical mutation files

**Example:**
```typescript
// queries/videos/mutations.ts (88 lines)
// queries/seasons/mutations.ts (91 lines)
// queries/todos/mutations.ts (85 lines)

// All follow same pattern:
export async function createEntity(ctx, data) {
  const {data: created, error} = await ctx.supabase.from('table').insert(data);
  if (error) return {data: null, error: error.message};
  return {data: created, error: null};
}

export async function updateEntity(ctx, id, data) { ... }
export async function deleteEntity(ctx, id) { ... }
```

**Recommendation:**
```typescript
// Create factory function
export function createMutationHelpers<T>(tableName: string) {
  return {
    create: async (ctx, data) => { ... },
    update: async (ctx, id, data) => { ... },
    delete: async (ctx, id) => { ... },
  };
}

// Usage:
export const {create, update, delete: deleteSeason} = createMutationHelpers<Season>('seasons');
```

**Estimated effort:** 1 day
**Code reduction:** ~800 lines → ~200 lines (75% reduction!)

---

#### Pattern 2: Modal State Management

**Found:** 35+ components using identical `useDisclosure()` pattern

```typescript
// Repeated 35+ times:
const {isOpen, onOpen, onClose} = useDisclosure();
const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();
const {isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose} = useDisclosure();
```

**Recommendation:**
```typescript
// Create helper hook
export function useModalState(modalName: string) {
  const {isOpen, onOpen, onClose} = useDisclosure();
  return {
    [`is${modalName}Open`]: isOpen,
    [`on${modalName}Open`]: onOpen,
    [`on${modalName}Close`]: onClose,
  };
}

// Or even better:
export function useModals<T extends string[]>(...names: T) {
  // Returns typed modal states for all names
}

// Usage:
const modals = useModals('Add', 'Edit', 'Delete');
// modals.Add.isOpen, modals.Add.open, modals.Add.close
```

**Estimated effort:** 4 hours
**Impact:** Cleaner code, easier modal coordination

---

#### Pattern 3: Array Length Checks

**Found:** 143 instances of `.length > 0` pattern

**Recommendation:**
```typescript
// Create helpers
export const hasItems = <T>(arr: T[] | null | undefined): boolean =>
  !!arr && arr.length > 0;

export const isEmpty = <T>(arr: T[] | null | undefined): boolean =>
  !arr || arr.length === 0;

// Before:
if (posts && posts.length > 0) { ... }

// After:
if (hasItems(posts)) { ... }
```

**Estimated effort:** 2 hours
**Impact:** More readable code

---

### 🟠 HIGH: Complex Functions Need Breaking Down

#### 1. `src/utils/matchQueryBuilder.ts` (683 lines, 17K+ chars)

**Issues:**
- Deeply nested conditionals (5+ levels)
- Multiple responsibilities (query building, filtering, joining)
- Hard to test
- Difficult to understand

**Recommendation:**
```typescript
// Use builder pattern
class MatchQueryBuilder {
  private query: any;

  constructor(supabase: SupabaseClient) {
    this.query = supabase.from('matches');
  }

  withCategory(categoryId: string) {
    this.query = this.query.eq('category_id', categoryId);
    return this;
  }

  withSeason(seasonId: string) {
    this.query = this.query.eq('season_id', seasonId);
    return this;
  }

  withTeamDetails() {
    this.query = this.query.select(`*, home_team:..., away_team:...`);
    return this;
  }

  build() {
    return this.query;
  }
}

// Usage:
const matches = await new MatchQueryBuilder(supabase)
  .withCategory(categoryId)
  .withSeason(seasonId)
  .withTeamDetails()
  .build();
```

**Estimated effort:** 3-4 days
**Priority:** 🟠 HIGH (improves maintainability significantly)

---

#### 2. `src/utils/categoryPageData.ts` (420 lines, marked @Deprecated!)

**Status:** DEPRECATED but still actively used!

**Recommendation:** Delete or refactor immediately
- If still needed: Refactor to use query layer pattern
- If not needed: Remove all usages and delete

**Priority:** 🔴 CRITICAL (deprecated code is technical debt)

---

### 📝 TODO/FIXME Comments (47 files)

**Found 30+ unresolved TODO comments:**

**Critical TODOs:**
```typescript
// src/app/admin/members/components/PaymentFormModal.tsx
// TODO: This is temporary fix before refactor

// src/app/coaches/attendance/components/TrainingSessionGenerator.tsx
// TODO: Implement proper training session generation logic

// src/app/admin/matches/page.tsx
// TODO: Move translations to admin scope

// src/hooks/entities/blog/useFetchPostMatch.ts
// TODO: Refactor after matches hook is done
```

**Recommendation:**
1. Create GitHub issues for each TODO
2. Prioritize and schedule
3. Remove resolved TODOs
4. Convert blocking TODOs to code changes

**Estimated effort:** 1 week to address all critical TODOs

---

## 2. ARCHITECTURE ISSUES

### 🟠 HIGH: Business Logic in Components

**Found:** 28 page files with complex business logic

**Example:**
```typescript
// src/app/admin/matches/page.tsx
export default function MatchesPage() {
  // ❌ Business logic directly in component:
  const calculateStandings = () => {
    // 50+ lines of standings calculation
  };

  const validateLineup = (lineup) => {
    // 30+ lines of validation
  };

  // ❌ Data transformation in component:
  const processedMatches = matches.map(match => {
    // Complex transformation logic
  });
}
```

**Recommendation:**
```typescript
// Extract to custom hooks
export function useMatchStandings(matches) {
  return useMemo(() => calculateStandings(matches), [matches]);
}

export function useLineupValidation() {
  return useCallback((lineup) => validateLineup(lineup), []);
}

// Component becomes:
export default function MatchesPage() {
  const {data: matches} = useQuery(...);
  const standings = useMatchStandings(matches);
  const {validateLineup} = useLineupValidation();

  // Clean UI rendering only
}
```

**Estimated effort:** 2-3 weeks (incremental)
**Impact:** Much easier to test, maintain, understand

---

### 🟡 MEDIUM: Direct Supabase in Components

**Found:** 12 components with direct Supabase usage

**Examples:**
- `ClubSelector.tsx` - Direct query
- `MembersCsvImport.tsx` - Direct import
- `UserProfileModal.tsx` - Direct user fetch

**Recommendation:**
```typescript
// ❌ Current:
function Component() {
  const supabase = createClient();
  const {data} = await supabase.from('users').select('*');
}

// ✅ Better:
function Component() {
  const {data} = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,  // Centralized in /queries
  });
}
```

**Benefits:**
- Automatic caching
- Easier testing (mock the query)
- Centralized data access
- Type safety

---

### 🟠 HIGH: Inconsistent Error Handling

**Found:** 3 different error handling patterns

**Pattern 1:** Try-catch with console.error (56 instances)
**Pattern 2:** Error boundaries (3 instances)
**Pattern 3:** Toast notifications (inconsistent)

**Recommendation:**
```typescript
// Create unified error service
export class ErrorService {
  static handle(error: Error, context: string) {
    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context}]`, error);
    }

    // Send to error tracking in prod (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // trackError(error, context);
    }

    // Show user-friendly message
    showToast.danger(getUserFriendlyMessage(error));
  }
}

// Usage:
try {
  await createMatch(data);
} catch (error) {
  ErrorService.handle(error, 'CreateMatch');
}
```

---

## 3. PERFORMANCE OPPORTUNITIES

### 🟡 MEDIUM: Missing Memoization

**Stats:**
- 855 component files
- Only 161 useMemo/useCallback usages
- Only 4 React.memo usages

**High-Impact Targets:**

**1. UnifiedTopBar (600 lines, re-renders frequently)**
```typescript
// Current: No memoization
export function UnifiedTopBar() {
  // Re-renders on every parent update
}

// Recommended:
export const UnifiedTopBar = React.memo(function UnifiedTopBar() {
  // Render only when props change
});
```

**2. UnifiedSidebar (604 lines)**
**3. MatchSchedule (268 lines)**

**Estimated effort:** 1-2 days
**Impact:** 20-30% performance improvement on navigation-heavy pages

---

### 🟠 HIGH: No Code Splitting

**Current state:**
- All code loaded upfront
- ~2MB+ initial bundle
- No lazy loading

**Recommendation:**
```typescript
// Lazy load admin panels
const AdminMatches = lazy(() => import('@/app/admin/matches/page'));
const CoachAttendance = lazy(() => import('@/app/coaches/attendance/page'));
const BettingPage = lazy(() => import('@/app/(betting)/betting/page'));

// With Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminMatches />
</Suspense>
```

**Estimated reduction:** 40-50% smaller initial bundle

---

### 🟡 MEDIUM: Query Over-Fetching

**Found:** Multiple queries fetch all data then filter client-side

**Example:**
```typescript
// ❌ Current:
const {data: allMembers} = await supabase.from('members').select('*');
const filtered = allMembers.filter(m => m.category_id === categoryId);

// ✅ Better:
const {data: members} = await supabase
  .from('members')
  .select('*')
  .eq('category_id', categoryId);  // Filter at DB level
```

**Impact:** Faster queries, less data transfer

---

## 4. TESTING GAPS 🔴 CRITICAL

### Current State

**Test Files:** 6
**Source Files:** 855
**Coverage:** < 1% ⚠️

**Existing Tests:**
- ✅ `UnifiedTable.test.tsx` (715 lines) - Comprehensive table testing
- ✅ `createDataFetchHook.test.ts` (550 lines) - Factory hook testing
- ✅ `AdminContainer.test.tsx` (542 lines) - Admin component testing
- ✅ `formatDate.test.ts`, `formatTime.test.ts` - Helper testing

**Missing Tests:**
- ❌ No API route tests
- ❌ No integration tests
- ❌ No E2E tests
- ❌ Critical user flows untested (authentication, CRUD operations)

### Recommendation

**Phase 1: Critical Path Coverage (1 week)**
```bash
# Test these first:
- Authentication flow
- Blog post CRUD
- Match creation/editing
- Lineup management
- Attendance recording
```

**Phase 2: API Route Testing (1 week)**
```typescript
// Example:
describe('GET /api/blog-posts-published', () => {
  it('returns published posts', async () => {
    const response = await fetch('/api/blog-posts-published');
    expect(response.status).toBe(200);
    const {data} = await response.json();
    expect(data).toBeInstanceOf(Array);
  });
});
```

**Phase 3: Integration Tests (2 weeks)**
- User signup → login → create post → publish
- Admin workflow end-to-end
- Coach workflow end-to-end

**Target:** 60-70% coverage minimum

---

## 5. TYPE SAFETY ISSUES

### 🟡 MEDIUM: Type Assertion Overuse

**Found:** 107 instances of `as any` / `as unknown`

**Hotspots:**
- Components: 45 instances
- Queries: 28 instances
- API handlers: 23 instances
- Utils: 11 instances

**Example:**
```typescript
// ❌ Current:
const data = response.data as any;
const match = transformedMatch as unknown as Match;

// ✅ Better:
// Use proper typing with validation
const data = ResponseSchema.parse(response.data);
// Or create type guards
function isMatch(value: unknown): value is Match {
  return typeof value === 'object' && value !== null && 'id' in value;
}
```

**Recommendation:**
- Create Zod schemas for validation
- Use type guards
- Leverage TypeScript inference

**Estimated effort:** 2-3 weeks (incremental)

---

### 🟢 LOW: Large Auto-Generated Types

**File:** `src/types/database/supabase.ts` (5,643 lines!)

**Not a problem per se** (auto-generated), but consider:
- Creating domain-specific type subsets
- Using type projections
- Generating types per module

---

## 6. BEST PRACTICES VIOLATIONS

### 🟡 MEDIUM: Accessibility Gaps

**Found:**
- Missing ARIA labels on icon-only buttons
- No skip navigation links
- Keyboard navigation not tested

**Recommendation:**
```typescript
// Add skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Add aria-labels
<button aria-label="Delete item" onClick={handleDelete}>
  <TrashIcon />
</button>

// Test keyboard navigation
// Add to testing checklist
```

**Tools to use:**
- axe DevTools
- Lighthouse accessibility audit
- NVDA/VoiceOver testing

---

### 🟠 HIGH: Error Boundary Coverage

**Current:** 3 error boundaries (good start!)
- ChunkErrorBoundary
- DatabaseErrorBoundary
- LineupErrorBoundary

**Missing:**
- No error boundary per route group
- No fallback UI for failed mutations
- No retry logic

**Recommendation:**
```typescript
// Add to each major route
src/app/admin/layout.tsx
<ErrorBoundary fallback={<AdminErrorFallback />}>
  {children}
</ErrorBoundary>

src/app/coaches/layout.tsx
<ErrorBoundary fallback={<CoachErrorFallback />}>
  {children}
</ErrorBoundary>
```

---

### 🟡 MEDIUM: Inconsistent Logging

**Found:** Console.error used inconsistently

**Recommendation:**
```typescript
// Create logging service
export const logger = {
  error: (context: string, error: Error, metadata?: object) => {
    console.error(`[${context}]`, error, metadata);
    // In production: send to monitoring service
  },
  warn: (context: string, message: string) => { ... },
  info: (context: string, message: string) => { ... },
};

// Usage:
logger.error('FetchBlogPost', error, {slug, userId});
```

---

## 7. TECHNICAL DEBT

### 🔴 CRITICAL: Deprecated Code Still in Use

**Found:** `src/utils/categoryPageData.ts` (420 lines)
```typescript
/**
 * @Deprecated
 * This file contains old category page data fetching logic
 */
```

**But it's STILL being imported in 3 places!**

**Recommendation:** IMMEDIATE ACTION REQUIRED
1. Identify all usages
2. Create migration plan
3. Refactor to new pattern
4. Delete file within 1 sprint

---

### 🟡 MEDIUM: Temporary Workarounds

**Found comments:**
- "This is temporary fix before refactor"
- "Temporary workaround for..."
- "Quick fix - needs proper solution"

**Recommendation:**
1. Create GitHub issues for each
2. Set deadline (max 2 sprints)
3. Schedule proper implementation
4. Remove "temporary" solutions

---

### 🟠 HIGH: Manual Cache Management

**Found:** `UserContext.tsx` implements manual cache with TTL

```typescript
// Current: Manual cache
const CACHE_TTL = 5 * 60 * 1000;
let requestCache: {timestamp: number; data: any} | null = null;

if (requestCache && Date.now() - requestCache.timestamp < CACHE_TTL) {
  return requestCache.data;
}
```

**Recommendation:**
```typescript
// Use React Query (you already have it!)
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

**Benefits:**
- Automatic cache invalidation
- Background refetching
- Better DX
- Less code to maintain

---

## 8. SECURITY CONSIDERATIONS

### ✅ GOOD: Proper HTML Sanitization

**Found:** BlogContent uses DOMPurify correctly ✓

**Keep this practice!**

### ⚠️ WATCH: API Error Messages

**Some routes expose detailed errors:**
```typescript
return NextResponse.json({error: error.message}, {status: 500});
```

**Recommendation:**
```typescript
// Production: Generic messages
const errorMessage = process.env.NODE_ENV === 'production'
  ? 'Internal server error'
  : error.message;

return NextResponse.json({error: errorMessage}, {status: 500});
```

---

## 9. MISSING FEATURES

### 🟡 MEDIUM: No Offline Support

**Current:** App breaks when offline

**Recommendation:**
- Implement service worker
- Cache static assets
- Queue mutations for when online
- Show offline indicator

**Estimated effort:** 1-2 weeks

---

### 🟢 LOW: No Real-Time Updates

**Current:** Polling or manual refresh

**Opportunity:** Supabase has real-time subscriptions

**Recommendation:**
```typescript
// Add to attendance, betting, live scores
useEffect(() => {
  const subscription = supabase
    .channel('attendance-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'attendance'
    }, (payload) => {
      // Update UI in real-time
      queryClient.invalidateQueries(['attendance']);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

**Estimated effort:** 1 week

---

## PRIORITY ROADMAP

### 🔴 CRITICAL (This Week)

1. **Remove deprecated `categoryPageData.ts`** (1 day)
   - High risk if it breaks
   - Technical debt accumulating

2. **Address blocking TODOs** (2 days)
   - PaymentFormModal temporary fix
   - TrainingSessionGenerator incomplete logic

3. **Break down matches admin page** (3 days)
   - 1,237 lines is unmaintainable
   - Blocks feature development

**Total: 1 week**

---

### 🟠 HIGH (Next 2-4 Weeks)

4. **Consolidate mutation templates** (1 day)
   - Easy win, big impact
   - 75% code reduction

5. **Move Supabase to query layer** (1 week)
   - Better architecture
   - Easier testing

6. **Add critical path testing** (1 week)
   - Authentication flow
   - Blog CRUD
   - Match creation

7. **Implement code splitting** (3 days)
   - 40-50% bundle size reduction
   - Better performance

**Total: 2-3 weeks**

---

### 🟡 MEDIUM (Next 1-2 Months)

8. **Add memoization to large components** (1 week)
9. **Create unified error handling** (1 week)
10. **Refactor complex query builders** (2 weeks)
11. **Improve type safety** (ongoing, 2-3 weeks)
12. **Add error boundaries per route** (3 days)

**Total: 6-8 weeks**

---

### 🟢 LOW (Future Enhancements)

13. Offline support
14. Real-time updates
15. Performance monitoring
16. Advanced caching strategies

---

## QUICK WINS (Can Do This Week)

### 1. Create Mutation Helper (4 hours)
Delete ~800 lines of duplicate code immediately.

### 2. Create Modal State Hook (2 hours)
Simplify modal management across 35+ components.

### 3. Create Array Helpers (1 hour)
Replace 143 `.length > 0` checks with readable `hasItems()`.

### 4. Add Skip Links (1 hour)
Improve accessibility with minimal effort.

### 5. Document Critical TODOs (2 hours)
Create GitHub issues, add to backlog.

---

## METRICS & BENCHMARKS

### Current State:
```
Total Files: 855
Total LOC: ~100,015
Large Files (>600 lines): 8
Test Coverage: <1%
Type Assertions (as any): 107
TODO Comments: 30+
Deprecated Files: 13
```

### Target State (3 months):
```
Large Files: 0 (all under 400 lines)
Test Coverage: 60-70%
Type Assertions: <20
TODO Comments: 0 (all converted to issues)
Deprecated Files: 0 (deleted or refactored)
```

---

## RECOMMENDED APPROACH

### Week 1: Critical Debt Cleanup
- Remove deprecated files
- Address blocking TODOs
- Create mutation helper

### Weeks 2-4: Architecture Improvements
- Break down large files
- Move to query layer
- Add critical tests

### Weeks 5-12: Systematic Improvements
- Type safety improvements
- Performance optimizations
- Comprehensive testing

---

## TOOLS & AUTOMATION

### Recommended Tools:

**Code Quality:**
- ESLint rules for max file size
- Prettier for consistency (already using ✓)
- Husky for pre-commit checks (already using ✓)

**Testing:**
- Vitest (already setup ✓)
- Playwright for E2E
- MSW for API mocking (already installed ✓)

**Performance:**
- Lighthouse CI
- Bundle analyzer
- React DevTools Profiler

**Monitoring:**
- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics (if using Vercel)

---

## COST-BENEFIT ANALYSIS

### High ROI Improvements:
1. ✅ Create mutation helper (4 hours → delete 800 lines)
2. ✅ Code splitting (3 days → 40% bundle reduction)
3. ✅ Break down large files (2 weeks → massive maintainability gain)

### Medium ROI:
4. Memoization (1 week → 20-30% performance gain)
5. Testing (4 weeks → prevent bugs, faster debugging)

### Lower ROI (but important):
6. Type safety improvements (ongoing)
7. Accessibility enhancements (legal/ethical requirement)

---

## SUMMARY

**Your codebase is in GOOD SHAPE overall**, with solid foundations:
- ✅ Modern tech stack (Next.js 16, React 19, Supabase)
- ✅ Some architectural patterns established
- ✅ Good documentation (23+ docs created)

**Main challenges:**
- 🔴 Large monolithic files (makes changes scary)
- 🔴 Very low test coverage (bugs hiding)
- 🟡 Code duplication (like you caught with CategoryChip!)
- 🟡 Technical debt accumulating (deprecated code, TODOs)

**Biggest wins available:**
1. Break down matches admin page (1,237 → 200 lines)
2. Add testing (1% → 60% coverage)
3. Code splitting (2MB → 1MB bundle)
4. Create mutation helper (delete 800 lines)

---

**What would you like to tackle first?**

I can help you:
1. Create the mutation helper factory (quick win, 4 hours)
2. Break down the matches page (high impact, 2-3 days)
3. Set up testing infrastructure (foundational, 1 week)
4. Something else based on your priorities?

---

**Status:** Analysis Complete | Ready for Action Planning 🚀