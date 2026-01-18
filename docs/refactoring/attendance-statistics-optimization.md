# Attendance Statistics Optimization - Refactoring Plan

**Version:** 1.0
**Date:** 2025-11-24
**Status:** Proposal
**Priority:** High

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Performance Problems](#performance-problems)
4. [Proposed Solutions](#proposed-solutions)
5. [Recommended Architecture](#recommended-architecture)
6. [Implementation Plan](#implementation-plan)
7. [Performance Impact](#performance-impact)
8. [Risk Analysis](#risk-analysis)
9. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Problem Statement

The member attendance statistics system suffers from significant performance issues due to:
- **N+1 query patterns** causing 20+ database queries per page load
- **Automatic statistics loading** on every page mount/refresh
- **Client-side aggregation** of large datasets
- **No caching layer** resulting in repeated calculations

**Current State:** With 20 members and 30 training sessions:
- Initial page load: **8-40+ database queries**
- Statistics expand: **Additional 21+ queries**
- Average load time: **2-5 seconds**

**Target State:** After optimization:
- Initial page load: **3-5 queries**
- Statistics load (lazy): **1-2 queries**
- Average load time: **< 500ms**

### Recommended Solution

**Hybrid Approach** combining:
1. **Database materialized views** for pre-computed statistics
2. **Server-side API endpoint** for aggregated data
3. **Lazy-loaded statistics tab** with caching
4. **Incremental updates** via triggers

---

## Current State Analysis

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React)                        │
│  - CoachesAttendancePage (page.tsx.backup)                        │
│  - AttendanceStatistics.tsx (auto-loads on mount)         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Business Logic (Hooks)                        │
│  - useAttendance() - Contains all statistics logic         │
│  - getMemberAttendanceStats() ← N+1 PROBLEM               │
│  - getAttendanceTrends() ← N+1 PROBLEM                    │
│  - getCoachAnalytics() ← Orchestrates expensive ops       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  API Layer (Next.js)                       │
│  - Generic entity endpoints                                 │
│  - No specialized statistics endpoints                      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                Database (Supabase/PostgreSQL)              │
│  - training_sessions                                        │
│  - member_attendance                                        │
│  - members                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Location | Purpose | Lines |
|------|----------|---------|-------|
| `page.tsx.backup` | `src/app/coaches/attendance/page.tsx.backup` | Main attendance page | 792 |
| `useAttendance.ts` | `src/hooks/entities/attendance/useAttendance.ts` | Core attendance logic | 989 |
| `AttendanceStatistics.tsx` | `src/app/coaches/attendance/components/AttendanceStatistics.tsx` | Statistics display | 480 |

### Data Flow

**Current Flow (Problematic):**

```
1. Page Mount
   ├─ Load global data (4 queries)
   ├─ Load training sessions (1 query)
   ├─ Load lineups (2 queries)
   └─ AttendanceStatistics mounts
       └─ AUTO-TRIGGERS getCoachAnalytics()
           ├─ getTrainingSessionStats() (2 queries)
           ├─ getMemberAttendanceStats() (1 + N queries) ← CRITICAL
           └─ getAttendanceTrends() (1 + M queries) ← CRITICAL

Total: 8-40+ queries depending on N members and M sessions
```

---

## Performance Problems

### 1. N+1 Query Pattern in Member Statistics

**Location:** `src/hooks/entities/attendance/useAttendance.ts:666-671`

**Problem Code:**
```typescript
// Query 1: Get all members
const {data: members} = await supabase
  .from('members')
  .select('id, name, surname')
  .eq('category_id', categoryId);

// Query 2-N: Loop through each member (N+1 PROBLEM)
for (const member of members || []) {
  const {data: attendance} = await supabase
    .from('member_attendance')
    .select('attendance_status, recorded_at')
    .eq('member_id', member.id)
    .in('training_session_id', sessions?.map((s) => s.id) || []);

  // Calculate stats in browser...
}
```

**Impact:**
- 20 members = **21 database queries**
- 50 members = **51 database queries**
- Each query: ~50-200ms
- **Total time: 1-10 seconds**

### 2. N+1 Query Pattern in Trend Analysis

**Location:** `src/hooks/entities/attendance/useAttendance.ts:853-857`

**Problem Code:**
```typescript
// Query 1: Get sessions
const {data: sessions} = await supabase
  .from('training_sessions')
  .select('id, session_date')
  .eq('status', 'done');

// Query 2-M: Loop through each session
for (const session of sessions || []) {
  const {data: attendance} = await supabase
    .from('member_attendance')
    .select('attendance_status')
    .eq('training_session_id', session.id);
}
```

**Impact:**
- 30 sessions in last 30 days = **31 queries**
- Combined with member stats: **52 total queries**

### 3. Automatic Statistics Loading

**Location:** `src/app/coaches/attendance/components/AttendanceStatistics.tsx:70-74`

**Problem Code:**
```typescript
useEffect(() => {
  if (categoryId && seasonId) {
    loadAnalytics();  // Triggers expensive operations automatically
  }
}, [categoryId, seasonId, loadAnalytics]);
```

**Impact:**
- Statistics load **on every page mount**
- Statistics reload **on every category/season change**
- No user control over when to load
- **Unnecessary data fetching** when user only wants to record attendance

### 4. Client-Side Aggregation

**Location:** Multiple functions in `useAttendance.ts`

**Problems:**
- Heavy array filtering and mapping in browser
- No memoization of results
- Recalculates on every render if dependencies change
- Memory-intensive for large datasets

### 5. No Caching Layer

**Impact:**
- Same statistics recalculated repeatedly
- No persistence between page visits
- No stale-while-revalidate pattern
- Server load increases with users

---

## Proposed Solutions

### Solution 1: Server-Side Aggregation with Bulk Queries

**Overview:** Fix N+1 queries by using server-side aggregation.

**Approach:**
```sql
-- Single query for member stats
SELECT
  m.id,
  m.name,
  m.surname,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') as present_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent') as absent_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late') as late_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') as excused_count,
  COUNT(DISTINCT ts.id) as total_sessions,
  ROUND(
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
    / NULLIF(COUNT(DISTINCT ts.id), 0) * 100
  ) as attendance_percentage
FROM members m
LEFT JOIN member_attendance ma ON m.id = ma.member_id
LEFT JOIN training_sessions ts ON ma.training_session_id = ts.id
WHERE m.category_id = $1
  AND ts.season_id = $2
  AND ts.status = 'done'
GROUP BY m.id, m.name, m.surname
ORDER BY m.surname, m.name;
```

**Pros:**
- Reduces 21 queries to **1 query**
- Fast to implement
- No schema changes needed
- Uses PostgreSQL's powerful aggregation

**Cons:**
- Still requires calculation on each request
- Complex trend analysis logic remains in query
- No caching of results

**Estimated Impact:**
- Query count: 21 → **1** (95% reduction)
- Load time: 2-5s → **300-500ms** (80% improvement)

---

### Solution 2: Materialized Views (Similar to Teams View)

**Overview:** Create materialized views for pre-computed statistics, following the existing pattern in `scripts/migrations/20241215_create_teams_materialized_view.sql`.

**Approach:**

**Materialized View 1: Member Attendance Statistics**
```sql
CREATE MATERIALIZED VIEW member_attendance_statistics AS
SELECT
  m.id as member_id,
  m.name,
  m.surname,
  m.category_id,
  ts.season_id,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') as present_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent') as absent_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late') as late_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') as excused_count,
  COUNT(DISTINCT ts.id) as total_sessions,
  ROUND(
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
    / NULLIF(COUNT(DISTINCT ts.id), 0) * 100
  ) as attendance_percentage
FROM members m
LEFT JOIN member_attendance ma ON m.id = ma.member_id
LEFT JOIN training_sessions ts ON ma.training_session_id = ts.id
WHERE ts.status = 'done'
GROUP BY m.id, m.name, m.surname, m.category_id, ts.season_id;

-- Indexes for fast lookups
CREATE INDEX idx_member_stats_category_season
  ON member_attendance_statistics(category_id, season_id);
CREATE INDEX idx_member_stats_member
  ON member_attendance_statistics(member_id);
```

**Materialized View 2: Attendance Trends**
```sql
CREATE MATERIALIZED VIEW attendance_trends AS
SELECT
  ts.id as session_id,
  ts.session_date,
  ts.category_id,
  ts.season_id,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present') as present_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent') as absent_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late') as late_count,
  COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused') as excused_count,
  (SELECT COUNT(*) FROM members WHERE category_id = ts.category_id) as total_members,
  ROUND(
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
    / NULLIF((SELECT COUNT(*) FROM members WHERE category_id = ts.category_id), 0) * 100
  ) as attendance_percentage
FROM training_sessions ts
LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
WHERE ts.status = 'done'
GROUP BY ts.id, ts.session_date, ts.category_id, ts.season_id
ORDER BY ts.session_date DESC;

-- Index
CREATE INDEX idx_attendance_trends_category_season_date
  ON attendance_trends(category_id, season_id, session_date);
```

**Auto-refresh Triggers:**
```sql
-- Trigger function to refresh views
CREATE OR REPLACE FUNCTION trigger_refresh_attendance_stats()
RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('refresh_attendance_stats', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers on relevant tables
CREATE TRIGGER refresh_attendance_stats_on_attendance_change
  AFTER INSERT OR UPDATE OR DELETE ON member_attendance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

CREATE TRIGGER refresh_attendance_stats_on_session_status
  AFTER UPDATE OF status ON training_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();
```

**Pros:**
- **Instant queries** - data pre-computed
- Reduces load time to < 100ms
- Follows existing team view pattern
- Automatic updates via triggers
- Scalable to large datasets

**Cons:**
- Requires database migration
- Refresh lag (1-2 seconds after data changes)
- Additional storage for materialized data
- Complexity in maintaining views

**Estimated Impact:**
- Query count: 52 → **2** (96% reduction)
- Load time: 2-5s → **50-100ms** (98% improvement)

---

### Solution 3: Hybrid Approach (RECOMMENDED)

**Overview:** Combine best aspects of both solutions with lazy loading.

**Components:**

#### A. Database Layer

**1. Create Materialized View for Core Statistics:**
```sql
-- Simple, frequently accessed stats
CREATE MATERIALIZED VIEW attendance_statistics_summary AS
SELECT
  category_id,
  season_id,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'done') as completed_sessions,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'planned') as planned_sessions,
  COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'cancelled') as cancelled_sessions,
  COUNT(DISTINCT ma.id) as total_attendance_records,
  ROUND(
    COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'done')::numeric
    / NULLIF(COUNT(DISTINCT ts.id), 0) * 100
  ) as completion_rate
FROM training_sessions ts
LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
GROUP BY category_id, season_id;
```

**2. Server-side Function for Complex Queries:**
```sql
-- PostgreSQL function for member stats with single query
CREATE OR REPLACE FUNCTION get_member_attendance_stats(
  p_category_id UUID,
  p_season_id UUID
)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  excused_count BIGINT,
  total_sessions BIGINT,
  attendance_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    CONCAT(m.name, ' ', m.surname),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused'),
    COUNT(DISTINCT ts.id),
    ROUND(
      COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
      / NULLIF(COUNT(DISTINCT ts.id), 0) * 100
    )
  FROM members m
  LEFT JOIN member_attendance ma ON m.id = ma.member_id
  LEFT JOIN training_sessions ts ON ma.training_session_id = ts.id
  WHERE m.category_id = p_category_id
    AND ts.season_id = p_season_id
    AND ts.status = 'done'
  GROUP BY m.id, m.name, m.surname
  ORDER BY m.surname, m.name;
END;
$$ LANGUAGE plpgsql;
```

#### B. API Layer

**New Endpoint:** `/api/attendance/statistics`

```typescript
// src/app/api/attendance/statistics/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const seasonId = searchParams.get('seasonId');

  // Call PostgreSQL function - single query
  const { data: memberStats } = await supabase
    .rpc('get_member_attendance_stats', {
      p_category_id: categoryId,
      p_season_id: seasonId
    });

  // Get summary from materialized view
  const { data: summary } = await supabase
    .from('attendance_statistics_summary')
    .select('*')
    .eq('category_id', categoryId)
    .eq('season_id', seasonId)
    .single();

  return Response.json({
    summary,
    memberStats,
    // Additional computed insights
    insights: generateInsights(memberStats),
    recommendations: generateRecommendations(memberStats)
  });
}
```

#### C. UI Layer - Lazy Loading with Tabs

**Restructure Attendance Page:**

```
CoachesAttendancePage
├── Filter Section (Category/Season)
├── Main Content Tabs ← NEW STRUCTURE
│   ├── Tab 1: Attendance Recording (default)
│   │   ├── Training Session List
│   │   └── Attendance Recording Table
│   └── Tab 2: Statistics & Analytics ← LAZY LOADED
│       ├── Summary Cards
│       ├── Member Performance Table
│       └── Attendance Trends Chart
└── Modals (unchanged)
```

**Implementation:**

```typescript
// page.tsx.backup - Tab structure
const [activeTab, setActiveTab] = useState<'attendance' | 'statistics'>('attendance');

return (
  <PageContainer>
    {/* Filters */}
    <Card>
      <Select label="Category" />
      <Select label="Season" />
    </Card>

    {/* Tab Navigation */}
    <Tabs
      selectedKey={activeTab}
      onSelectionChange={setActiveTab}
    >
      <Tab key="attendance" title="Attendance Recording">
        {/* Existing attendance recording UI */}
        <TrainingSessionList />
        <AttendanceRecordingTable />
      </Tab>

      <Tab key="statistics" title="Statistics">
        {/* Lazy-loaded statistics component */}
        {activeTab === 'statistics' && (
          <AttendanceStatisticsLazy
            categoryId={selectedCategory}
            seasonId={selectedSeason}
          />
        )}
      </Tab>
    </Tabs>
  </PageContainer>
);
```

**New Lazy Statistics Component:**

```typescript
// components/AttendanceStatisticsLazy.tsx
export default function AttendanceStatisticsLazy({ categoryId, seasonId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only load when component mounts (user clicked tab)
  useEffect(() => {
    if (categoryId && seasonId) {
      loadStatistics();
    }
  }, [categoryId, seasonId]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/attendance/statistics?categoryId=${categoryId}&seasonId=${seasonId}`
      );
      const data = await response.json();
      setData(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div>
      <SummaryCards data={data.summary} />
      <MemberPerformanceTable data={data.memberStats} />
      <TrendsChart data={data.trends} />
      <InsightsPanel insights={data.insights} />
    </div>
  );
}
```

#### D. Caching Layer

**React Query Integration:**

```typescript
// hooks/useAttendanceStatistics.ts
import { useQuery } from '@tanstack/react-query';

export function useAttendanceStatistics(categoryId: string, seasonId: string) {
  return useQuery({
    queryKey: ['attendance-statistics', categoryId, seasonId],
    queryFn: async () => {
      const res = await fetch(
        `/api/attendance/statistics?categoryId=${categoryId}&seasonId=${seasonId}`
      );
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!categoryId && !!seasonId
  });
}
```

**Benefits:**
- Automatic caching
- Stale-while-revalidate pattern
- Request deduplication
- Automatic refetching on window focus

---

### Solution Comparison

| Feature | Solution 1 (Server Aggregation) | Solution 2 (Materialized Views) | Solution 3 (Hybrid) |
|---------|--------------------------------|----------------------------------|---------------------|
| **Query Count** | 52 → 2-3 | 52 → 2 | 52 → 2 |
| **Load Time** | 300-500ms | 50-100ms | 50-100ms |
| **Implementation Effort** | Low | Medium | Medium-High |
| **Database Changes** | None | Yes (views) | Yes (views + functions) |
| **Scalability** | Medium | High | Very High |
| **Maintenance** | Low | Medium | Medium |
| **Caching** | Manual | Built-in | Built-in + Client |
| **Real-time Updates** | Yes | 1-2s lag | 1-2s lag |
| **User Control** | No | No | **Yes (lazy load)** |
| **Memory Usage** | Same | Lower | Lowest |

**Recommendation:** **Solution 3 (Hybrid)** provides the best balance of performance, user experience, and maintainability.

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer                              │
│  ┌──────────────┐  ┌─────────────────────────────┐        │
│  │ Tab 1:       │  │ Tab 2: Statistics (LAZY)    │        │
│  │ Attendance   │  │ - Only loads when clicked    │        │
│  │ Recording    │  │ - Uses React Query cache     │        │
│  └──────────────┘  └─────────────────────────────┘        │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  React Query Cache                         │
│  - 5 min stale time                                        │
│  - 30 min cache time                                       │
│  - Automatic invalidation                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              API Layer (Next.js)                           │
│  ┌──────────────────────────────────────────────┐         │
│  │ /api/attendance/statistics                   │         │
│  │ - Calls PostgreSQL functions                 │         │
│  │ - Returns aggregated JSON                    │         │
│  └──────────────────────────────────────────────┘         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│          Database Layer (PostgreSQL/Supabase)              │
│  ┌─────────────────────────┐  ┌──────────────────────┐    │
│  │ Materialized Views      │  │ PostgreSQL Functions │    │
│  │ - Pre-computed stats    │  │ - get_member_stats() │    │
│  │ - Auto-refresh triggers │  │ - Single query       │    │
│  └─────────────────────────┘  └──────────────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Base Tables (unchanged)                          │     │
│  │ - training_sessions                              │     │
│  │ - member_attendance                              │     │
│  │ - members                                        │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (New)

**Attendance Recording Flow (unchanged):**
```
User selects session → Fetch attendance records → Display table → Record attendance
```

**Statistics Flow (NEW - lazy loaded):**
```
User clicks "Statistics" tab
  ↓
Check React Query cache
  ↓ (cache miss or stale)
GET /api/attendance/statistics?categoryId=X&seasonId=Y
  ↓
Execute 2 parallel queries:
  1. SELECT FROM attendance_statistics_summary (materialized view)
  2. SELECT FROM get_member_attendance_stats() (PostgreSQL function)
  ↓
Compute insights/recommendations in API route
  ↓
Return JSON (single response)
  ↓
Cache in React Query (5 min stale, 30 min cache)
  ↓
Render statistics UI

Subsequent visits (within 5 min): Instant from cache
Subsequent visits (5-30 min): Show stale data, fetch fresh in background
```

### Benefits

1. **Performance:**
   - Initial page load: 8 queries → **3 queries** (attendance recording only)
   - Statistics load: 52 queries → **2 queries** (when user requests)
   - Total queries reduced by **96%** when statistics not needed
   - Load time: 2-5s → **50-100ms** for statistics

2. **User Experience:**
   - Faster initial page load (no unnecessary statistics)
   - User controls when to load heavy analytics
   - Clear separation of concerns (recording vs analysis)
   - Intuitive tab interface
   - No blocking operations

3. **Scalability:**
   - Pre-computed materialized views scale to large datasets
   - Client-side caching reduces server load
   - Database functions eliminate N+1 patterns
   - Ready for 100+ members and 200+ sessions

4. **Maintainability:**
   - Clear separation between recording and analytics
   - Easier to debug and test
   - Follows existing materialized view pattern
   - Standard React Query patterns

---

## Implementation Plan

### Phase 1: Database Layer (Week 1)

**Goal:** Create optimized database structures

#### Tasks:

**1.1 Create Materialized View for Summary Statistics**
```sql
-- File: scripts/migrations/20251125_create_attendance_statistics_mv.sql
CREATE MATERIALIZED VIEW attendance_statistics_summary AS
SELECT
  category_id,
  season_id,
  COUNT(DISTINCT id) FILTER (WHERE status = 'done') as completed_sessions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'planned') as planned_sessions,
  COUNT(DISTINCT id) FILTER (WHERE status = 'cancelled') as cancelled_sessions,
  ROUND(
    COUNT(DISTINCT id) FILTER (WHERE status = 'done')::numeric
    / NULLIF(COUNT(DISTINCT id), 0) * 100
  ) as completion_rate,
  MAX(session_date) FILTER (WHERE status = 'done') as last_session_date,
  MIN(session_date) FILTER (WHERE status = 'planned') as next_session_date
FROM training_sessions
WHERE category_id IS NOT NULL AND season_id IS NOT NULL
GROUP BY category_id, season_id;

-- Indexes
CREATE UNIQUE INDEX idx_att_stats_summary_pk
  ON attendance_statistics_summary(category_id, season_id);
CREATE INDEX idx_att_stats_summary_category
  ON attendance_statistics_summary(category_id);
CREATE INDEX idx_att_stats_summary_season
  ON attendance_statistics_summary(season_id);

-- Permissions
GRANT SELECT ON attendance_statistics_summary TO authenticated;
```

**1.2 Create PostgreSQL Function for Member Statistics**
```sql
-- File: scripts/migrations/20251125_create_attendance_functions.sql
CREATE OR REPLACE FUNCTION get_member_attendance_stats(
  p_category_id UUID,
  p_season_id UUID
)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  member_surname TEXT,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  excused_count BIGINT,
  total_sessions BIGINT,
  attendance_percentage NUMERIC,
  last_attendance_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.surname,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused'),
    COUNT(DISTINCT ts.id),
    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(COUNT(DISTINCT ts.id), 0) * 100,
        0
      ),
      2
    ),
    MAX(ma.recorded_at)
  FROM members m
  LEFT JOIN member_attendance ma ON m.id = ma.member_id
  LEFT JOIN training_sessions ts ON ma.training_session_id = ts.id
  WHERE m.category_id = p_category_id
    AND ts.season_id = p_season_id
    AND ts.status = 'done'
  GROUP BY m.id, m.name, m.surname
  ORDER BY m.surname, m.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Permissions
GRANT EXECUTE ON FUNCTION get_member_attendance_stats(UUID, UUID) TO authenticated;
```

**1.3 Create Auto-Refresh Triggers**
```sql
-- Trigger function
CREATE OR REPLACE FUNCTION trigger_refresh_attendance_stats()
RETURNS trigger AS $$
BEGIN
  -- Schedule async refresh (non-blocking)
  PERFORM pg_notify('refresh_attendance_stats', '');
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers on data changes
CREATE TRIGGER refresh_att_stats_on_attendance_insert
  AFTER INSERT ON member_attendance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

CREATE TRIGGER refresh_att_stats_on_attendance_update
  AFTER UPDATE ON member_attendance
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

CREATE TRIGGER refresh_att_stats_on_session_status_change
  AFTER UPDATE OF status ON training_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_attendance_stats();

-- Initial refresh
REFRESH MATERIALIZED VIEW attendance_statistics_summary;
```

**1.4 Create Trends Function**
```sql
CREATE OR REPLACE FUNCTION get_attendance_trends(
  p_category_id UUID,
  p_season_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  session_id UUID,
  session_date DATE,
  present_count BIGINT,
  absent_count BIGINT,
  late_count BIGINT,
  excused_count BIGINT,
  total_members BIGINT,
  attendance_percentage NUMERIC
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_end_date := CURRENT_DATE;
  v_start_date := v_end_date - p_days;

  RETURN QUERY
  WITH category_members AS (
    SELECT COUNT(*) as total
    FROM members
    WHERE category_id = p_category_id
  )
  SELECT
    ts.id,
    ts.session_date::DATE,
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'absent'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'late'),
    COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'excused'),
    cm.total,
    ROUND(
      COALESCE(
        COUNT(ma.id) FILTER (WHERE ma.attendance_status = 'present')::numeric
        / NULLIF(cm.total, 0) * 100,
        0
      ),
      2
    )
  FROM training_sessions ts
  CROSS JOIN category_members cm
  LEFT JOIN member_attendance ma ON ts.id = ma.training_session_id
  WHERE ts.category_id = p_category_id
    AND ts.season_id = p_season_id
    AND ts.status = 'done'
    AND ts.session_date >= v_start_date
    AND ts.session_date <= v_end_date
  GROUP BY ts.id, ts.session_date, cm.total
  ORDER BY ts.session_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_attendance_trends(UUID, UUID, INTEGER) TO authenticated;
```

**Testing:**
```sql
-- Test summary view
SELECT * FROM attendance_statistics_summary
WHERE category_id = 'test-category-id';

-- Test member stats function
SELECT * FROM get_member_attendance_stats(
  'test-category-id'::UUID,
  'test-season-id'::UUID
);

-- Test trends function
SELECT * FROM get_attendance_trends(
  'test-category-id'::UUID,
  'test-season-id'::UUID,
  30
);
```

**Deliverables:**
- Migration SQL files
- Test queries
- Performance benchmarks (before/after)

---

### Phase 2: API Layer (Week 2)

**Goal:** Create optimized API endpoint

#### Tasks:

**2.1 Create Statistics API Route**

```typescript
// File: src/app/api/attendance/statistics/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const {searchParams} = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const seasonId = searchParams.get('seasonId');
  const days = parseInt(searchParams.get('days') || '30');

  if (!categoryId || !seasonId) {
    return NextResponse.json(
      {error: 'categoryId and seasonId are required'},
      {status: 400}
    );
  }

  try {
    const supabase = createClient();

    // Execute all queries in parallel
    const [summaryResult, memberStatsResult, trendsResult] = await Promise.all([
      // Query 1: Summary from materialized view
      supabase
        .from('attendance_statistics_summary')
        .select('*')
        .eq('category_id', categoryId)
        .eq('season_id', seasonId)
        .single(),

      // Query 2: Member stats from function (single query)
      supabase.rpc('get_member_attendance_stats', {
        p_category_id: categoryId,
        p_season_id: seasonId
      }),

      // Query 3: Trends from function (single query)
      supabase.rpc('get_attendance_trends', {
        p_category_id: categoryId,
        p_season_id: seasonId,
        p_days: days
      })
    ]);

    // Handle errors
    if (summaryResult.error) throw summaryResult.error;
    if (memberStatsResult.error) throw memberStatsResult.error;
    if (trendsResult.error) throw trendsResult.error;

    // Generate insights (light computation)
    const insights = generateInsights(
      memberStatsResult.data,
      trendsResult.data
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
      memberStatsResult.data,
      summaryResult.data
    );

    return NextResponse.json({
      summary: summaryResult.data,
      memberStats: memberStatsResult.data,
      trends: trendsResult.data,
      insights,
      recommendations,
      metadata: {
        generated_at: new Date().toISOString(),
        query_count: 3,
        cache_hint: 'stale-while-revalidate=300' // 5 minutes
      }
    });
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    return NextResponse.json(
      {error: 'Failed to fetch statistics'},
      {status: 500}
    );
  }
}

// Helper functions (moved from client)
function generateInsights(memberStats: any[], trends: any[]) {
  const insights = [];

  // Low attendance members
  const lowAttendance = memberStats.filter(m => m.attendance_percentage < 50);
  if (lowAttendance.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Attendance Alert',
      message: `${lowAttendance.length} member(s) have attendance below 50%`,
      members: lowAttendance.map(m => `${m.member_name} ${m.member_surname}`)
    });
  }

  // High performers
  const highPerformers = memberStats.filter(m => m.attendance_percentage >= 90);
  if (highPerformers.length > 0) {
    insights.push({
      type: 'success',
      title: 'Excellent Attendance',
      message: `${highPerformers.length} member(s) have attendance above 90%`,
      count: highPerformers.length
    });
  }

  // Attendance trend
  if (trends.length >= 5) {
    const recent = trends.slice(-5);
    const avgRecent = recent.reduce((acc, t) => acc + t.attendance_percentage, 0) / recent.length;
    const older = trends.slice(-10, -5);
    if (older.length > 0) {
      const avgOlder = older.reduce((acc, t) => acc + t.attendance_percentage, 0) / older.length;
      const trend = avgRecent > avgOlder ? 'improving' : avgRecent < avgOlder ? 'declining' : 'stable';

      insights.push({
        type: trend === 'improving' ? 'success' : trend === 'declining' ? 'warning' : 'info',
        title: 'Attendance Trend',
        message: `Overall attendance is ${trend}`,
        data: {avgRecent, avgOlder, trend}
      });
    }
  }

  return insights;
}

function generateRecommendations(memberStats: any[], summary: any) {
  const recommendations = [];

  // Members needing attention
  const needsAttention = memberStats.filter(m =>
    m.absent_count >= 3 || m.attendance_percentage < 60
  );

  if (needsAttention.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Contact Members',
      description: `Reach out to ${needsAttention.length} member(s) with low attendance`,
      members: needsAttention.slice(0, 5).map(m => ({
        id: m.member_id,
        name: `${m.member_name} ${m.member_surname}`,
        attendance_percentage: m.attendance_percentage
      }))
    });
  }

  // Session completion rate
  if (summary?.completion_rate < 70) {
    recommendations.push({
      priority: 'medium',
      action: 'Improve Session Completion',
      description: `Only ${summary.completion_rate}% of planned sessions were completed`
    });
  }

  return recommendations;
}
```

**2.2 Add API Route to Config**

```typescript
// File: src/lib/api-routes.ts
export const API_ROUTES = {
  // ... existing routes
  attendance: {
    statistics: '/api/attendance/statistics'
  }
};
```

**2.3 Testing**

```typescript
// File: src/app/api/attendance/statistics/route.test.ts
describe('GET /api/attendance/statistics', () => {
  it('should return statistics for valid category and season', async () => {
    const response = await fetch(
      '/api/attendance/statistics?categoryId=test-id&seasonId=test-id'
    );
    const data = await response.json();

    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('memberStats');
    expect(data).toHaveProperty('trends');
    expect(data).toHaveProperty('insights');
    expect(data.metadata.query_count).toBe(3);
  });

  it('should return 400 for missing parameters', async () => {
    const response = await fetch('/api/attendance/statistics');
    expect(response.status).toBe(400);
  });
});
```

**Deliverables:**
- API route implementation
- Helper functions for insights/recommendations
- Unit tests
- API documentation

---

### Phase 3: UI Refactoring (Week 3)

**Goal:** Implement tab structure and lazy loading

#### Tasks:

**3.1 Install React Query (if not already installed)**

```bash
npm install @tanstack/react-query
```

**3.2 Setup React Query Provider**

```typescript
// File: src/app/providers.tsx or src/components/providers/QueryProvider.tsx
'use client';

import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {useState} from 'react';

export function QueryProvider({children}: {children: React.ReactNode}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 30 * 60 * 1000, // 30 minutes
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: 1
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

**3.3 Create Custom Hook for Statistics**

```typescript
// File: src/hooks/entities/attendance/useAttendanceStatistics.ts
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {API_ROUTES} from '@/lib/api-routes';

export interface AttendanceStatistics {
  summary: {
    completed_sessions: number;
    planned_sessions: number;
    cancelled_sessions: number;
    completion_rate: number;
    last_session_date: string;
    next_session_date: string;
  };
  memberStats: Array<{
    member_id: string;
    member_name: string;
    member_surname: string;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    total_sessions: number;
    attendance_percentage: number;
    last_attendance_date: string;
  }>;
  trends: Array<{
    session_id: string;
    session_date: string;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    total_members: number;
    attendance_percentage: number;
  }>;
  insights: Array<{
    type: 'success' | 'warning' | 'info';
    title: string;
    message: string;
    data?: any;
  }>;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    description: string;
    members?: any[];
  }>;
  metadata: {
    generated_at: string;
    query_count: number;
  };
}

export function useAttendanceStatistics(
  categoryId?: string,
  seasonId?: string,
  days: number = 30
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['attendance-statistics', categoryId, seasonId, days],
    queryFn: async (): Promise<AttendanceStatistics> => {
      const params = new URLSearchParams({
        categoryId: categoryId!,
        seasonId: seasonId!,
        days: days.toString()
      });

      const response = await fetch(
        `${API_ROUTES.attendance.statistics}?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }

      return response.json();
    },
    enabled: !!categoryId && !!seasonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });

  // Invalidate cache when attendance is recorded
  const invalidateStatistics = () => {
    queryClient.invalidateQueries({
      queryKey: ['attendance-statistics', categoryId, seasonId]
    });
  };

  return {
    ...query,
    invalidateStatistics
  };
}
```

**3.4 Refactor Main Attendance Page with Tabs**

```typescript
// File: src/app/coaches/attendance/page.tsx.backup (partial refactor)
'use client';

import {useState} from 'react';
import {Tabs, Tab} from '@heroui/react';

export default function CoachesAttendancePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'statistics'>('attendance');

  // ... existing hooks for attendance recording

  return (
    <PageContainer title="Attendance Management">
      {/* Filter Section (unchanged) */}
      <Card className="mb-6">
        <CardBody className="flex flex-row gap-4">
          <Select
            label="Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {/* categories */}
          </Select>
          <Select
            label="Season"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
          >
            {/* seasons */}
          </Select>
        </CardBody>
      </Card>

      {/* Tab Navigation */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as any)}
        className="mb-6"
        size="lg"
      >
        <Tab key="attendance" title="Attendance Recording">
          {/* Existing attendance recording UI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Training Session List */}
            <TrainingSessionList
              sessions={sessions}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSession}
              onAddSession={() => setIsSessionModalOpen(true)}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
              loading={trainingSessionsLoading}
            />

            {/* Right: Attendance Recording */}
            <AttendanceRecordingPanel
              selectedSession={selectedSession}
              attendanceRecords={attendanceRecords}
              members={filteredMembers}
              onRecordAttendance={handleRecordAttendance}
              loading={loading}
            />
          </div>
        </Tab>

        <Tab key="statistics" title="Statistics & Analytics">
          {/* NEW: Lazy-loaded statistics */}
          {activeTab === 'statistics' && selectedCategory && selectedSeason && (
            <AttendanceStatisticsLazy
              categoryId={selectedCategory}
              seasonId={selectedSeason}
            />
          )}
          {activeTab === 'statistics' && (!selectedCategory || !selectedSeason) && (
            <Card>
              <CardBody>
                <p className="text-center text-gray-500">
                  Please select a category and season to view statistics
                </p>
              </CardBody>
            </Card>
          )}
        </Tab>
      </Tabs>

      {/* Modals (unchanged) */}
    </PageContainer>
  );
}
```

**3.5 Create New Lazy Statistics Component**

```typescript
// File: src/app/coaches/attendance/components/AttendanceStatisticsLazy.tsx
'use client';

import {useState} from 'react';
import {Card, CardBody, CardHeader, Tabs, Tab, Chip} from '@heroui/react';
import {
  ChartBarIcon,
  UserGroupIcon,
  TrendingUpIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import {useAttendanceStatistics} from '@/hooks/entities/attendance/useAttendanceStatistics';
import {LoadingSpinner} from '@/components';

interface Props {
  categoryId: string;
  seasonId: string;
}

export default function AttendanceStatisticsLazy({categoryId, seasonId}: Props) {
  const [selectedDays, setSelectedDays] = useState(30);
  const {data, isLoading, error} = useAttendanceStatistics(
    categoryId,
    seasonId,
    selectedDays
  );

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-96">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <p className="text-danger">Failed to load statistics. Please try again.</p>
        </CardBody>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Completed Sessions</p>
            <p className="text-3xl font-bold">{data.summary.completed_sessions}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Planned Sessions</p>
            <p className="text-3xl font-bold">{data.summary.planned_sessions}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-3xl font-bold">{data.summary.completion_rate}%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Cancelled Sessions</p>
            <p className="text-3xl font-bold">{data.summary.cancelled_sessions}</p>
          </CardBody>
        </Card>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <Card>
          <CardHeader>
            <LightBulbIcon className="w-6 h-6 mr-2" />
            <h3 className="text-xl font-semibold">Insights</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {data.insights.map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success'
                      ? 'bg-green-50 border-green-200'
                      : insight.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <h4 className="font-semibold">{insight.title}</h4>
                  <p className="text-sm mt-1">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Card>
        <CardBody>
          <Tabs>
            <Tab key="members" title={
              <div className="flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4" />
                Member Performance
              </div>
            }>
              <MemberPerformanceTable memberStats={data.memberStats} />
            </Tab>

            <Tab key="trends" title={
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="w-4 h-4" />
                Attendance Trends
              </div>
            }>
              <AttendanceTrendsChart
                trends={data.trends}
                onDaysChange={setSelectedDays}
                selectedDays={selectedDays}
              />
            </Tab>

            <Tab key="recommendations" title="Recommendations">
              <RecommendationsPanel recommendations={data.recommendations} />
            </Tab>
          </Tabs>
        </CardBody>
      </Card>

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-right">
        Generated at: {new Date(data.metadata.generated_at).toLocaleString()}
        {' • '}
        Queries: {data.metadata.query_count}
      </div>
    </div>
  );
}

// Sub-components (MemberPerformanceTable, AttendanceTrendsChart, etc.)
// ... implementation details
```

**3.6 Invalidate Cache on Attendance Changes**

```typescript
// File: src/hooks/entities/attendance/useAttendance.ts (update)
import {useQueryClient} from '@tanstack/react-query';

export function useAttendance() {
  const queryClient = useQueryClient();

  const recordAttendance = useCallback(async (...args) => {
    // ... existing logic

    // After successful attendance recording:
    queryClient.invalidateQueries({
      queryKey: ['attendance-statistics']
    });
  }, [queryClient]);

  // ... rest of hook
}
```

**Deliverables:**
- Refactored page with tab structure
- Lazy-loaded statistics component
- React Query integration
- Sub-components for statistics display
- Cache invalidation on data changes

---

### Phase 4: Testing & Optimization (Week 4)

**Goal:** Ensure quality and performance

#### Tasks:

**4.1 Performance Testing**

```typescript
// File: tests/performance/attendance-statistics.test.ts
describe('Attendance Statistics Performance', () => {
  it('should load statistics in under 500ms', async () => {
    const start = performance.now();

    const response = await fetch(
      `/api/attendance/statistics?categoryId=${testCategoryId}&seasonId=${testSeasonId}`
    );
    await response.json();

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should execute no more than 3 database queries', async () => {
    const queries = await trackDatabaseQueries(async () => {
      await fetch(`/api/attendance/statistics?categoryId=${testCategoryId}&seasonId=${testSeasonId}`);
    });

    expect(queries.length).toBeLessThanOrEqual(3);
  });

  it('should cache results for 5 minutes', async () => {
    const firstFetch = await fetchStatistics();
    const secondFetch = await fetchStatistics();

    expect(secondFetch.fromCache).toBe(true);
  });
});
```

**4.2 Load Testing**

```bash
# Using Apache Bench or k6
ab -n 1000 -c 10 "http://localhost:3000/api/attendance/statistics?categoryId=X&seasonId=Y"
```

**Expected Results:**
- Average response time: < 200ms
- 95th percentile: < 500ms
- No database connection errors
- Materialized view refresh completes < 2s

**4.3 Integration Testing**

```typescript
describe('End-to-End Statistics Flow', () => {
  it('should display statistics when tab is clicked', async () => {
    // Navigate to attendance page
    // Select category and season
    // Click statistics tab
    // Verify data loads
    // Verify charts render
  });

  it('should refresh statistics after recording attendance', async () => {
    // Load statistics
    // Record attendance for a member
    // Verify statistics update
  });
});
```

**4.4 Database Performance Monitoring**

```sql
-- Check materialized view size
SELECT pg_size_pretty(pg_total_relation_size('attendance_statistics_summary'));

-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM get_member_attendance_stats('category-id', 'season-id');

-- Monitor refresh performance
SELECT schemaname, matviewname, last_refresh
FROM pg_matviews
WHERE matviewname = 'attendance_statistics_summary';
```

**4.5 Optimization Checklist**

- [ ] Database indexes created and used
- [ ] Materialized view refreshes < 2 seconds
- [ ] API endpoint responds < 500ms
- [ ] React Query caching works correctly
- [ ] No N+1 queries in logs
- [ ] Frontend renders without lag
- [ ] Mobile performance acceptable
- [ ] Error handling implemented
- [ ] Loading states clear to users
- [ ] Cache invalidation works correctly

**Deliverables:**
- Performance test suite
- Load testing results
- Integration tests
- Performance benchmarks document
- Optimization recommendations

---

### Phase 5: Documentation & Deployment (Week 5)

**Goal:** Document changes and deploy safely

#### Tasks:

**5.1 Update Technical Documentation**

```markdown
# File: docs/architecture/attendance-statistics.md

## Attendance Statistics Architecture

### Overview
The attendance statistics system uses a hybrid approach combining materialized views,
PostgreSQL functions, and client-side caching for optimal performance.

### Components

1. **Database Layer**
   - Materialized View: `attendance_statistics_summary`
   - Function: `get_member_attendance_stats(category_id, season_id)`
   - Function: `get_attendance_trends(category_id, season_id, days)`
   - Auto-refresh triggers on data changes

2. **API Layer**
   - Endpoint: `GET /api/attendance/statistics`
   - Query parameters: categoryId, seasonId, days (optional)
   - Returns: Aggregated statistics + insights + recommendations

3. **UI Layer**
   - Tab-based navigation (Attendance Recording | Statistics)
   - Lazy-loaded statistics component
   - React Query for caching (5 min stale, 30 min cache)

### Data Flow
[Diagram here]

### Performance Characteristics
- Initial page load: 3-5 queries (attendance recording only)
- Statistics load: 2-3 queries (when user clicks tab)
- Average response time: 50-100ms
- 96% reduction in queries vs previous implementation

### Maintenance

**Refresh Materialized View:**
```sql
REFRESH MATERIALIZED VIEW attendance_statistics_summary;
```

**Monitor Performance:**
```sql
SELECT * FROM pg_stat_statements WHERE query LIKE '%attendance_statistics%';
```
```

**5.2 Create Migration Guide**

```markdown
# File: docs/migrations/attendance-statistics-refactor.md

## Migration Guide: Attendance Statistics Optimization

### Pre-Migration Checklist
- [ ] Back up database
- [ ] Test migrations in staging
- [ ] Notify users of maintenance window
- [ ] Prepare rollback plan

### Step-by-Step Migration

**Step 1: Database Migration (5-10 minutes)**
```bash
# Run migration scripts
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_statistics_mv.sql
psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_functions.sql
```

**Step 2: Verify Database Changes**
```sql
-- Check materialized view exists
SELECT * FROM attendance_statistics_summary LIMIT 1;

-- Check functions exist
SELECT * FROM get_member_attendance_stats('test-id', 'test-id');
```

**Step 3: Deploy API Changes**
```bash
# Deploy new API endpoint
npm run build
npm run deploy
```

**Step 4: Deploy UI Changes**
```bash
# Deploy refactored UI
npm run build
npm run deploy
```

**Step 5: Monitor**
- Watch error logs
- Check API response times
- Verify statistics load correctly
- Monitor database load

### Rollback Plan
If issues occur:
```sql
-- Drop new objects
DROP MATERIALIZED VIEW IF EXISTS attendance_statistics_summary CASCADE;
DROP FUNCTION IF EXISTS get_member_attendance_stats CASCADE;
DROP FUNCTION IF EXISTS get_attendance_trends CASCADE;
```

Then redeploy previous version of code.

### Post-Migration Verification
- [ ] Statistics load in < 500ms
- [ ] No errors in logs
- [ ] Materialized view refreshes on data changes
- [ ] Cache invalidation works
- [ ] User experience improved
```

**5.3 User Documentation**

```markdown
# File: docs/user-guide/attendance-statistics.md

## Using Attendance Statistics

### Overview
The attendance statistics feature provides insights into member attendance patterns,
helping coaches identify issues and improve participation.

### Accessing Statistics

1. Navigate to **Coaches → Attendance Management**
2. Select a **Category** and **Season**
3. Click the **Statistics & Analytics** tab

### Understanding Statistics

**Summary Cards:**
- **Completed Sessions**: Number of training sessions marked as "done"
- **Planned Sessions**: Upcoming training sessions
- **Completion Rate**: Percentage of planned sessions that were completed
- **Cancelled Sessions**: Sessions that were cancelled

**Member Performance:**
- View attendance percentage for each member
- See breakdown of present/absent/late/excused
- Identify members needing attention

**Attendance Trends:**
- Visual chart showing attendance over time
- Adjust timeframe (7, 14, 30, 60 days)
- Spot patterns and trends

**Insights:**
- Automated insights based on attendance data
- Warnings for low attendance
- Recognition for high performers

**Recommendations:**
- Actionable suggestions for improving attendance
- Members to contact
- Areas for improvement

### Tips
- Statistics update within 1-2 seconds of recording attendance
- Use the trends chart to identify seasonal patterns
- Check insights regularly for early warning signs
```

**5.4 Deployment Plan**

**Staging Deployment:**
1. Deploy to staging environment
2. Run automated tests
3. Manual QA testing
4. Performance validation
5. Load testing

**Production Deployment:**
1. **Schedule maintenance window** (low-traffic period)
2. **Announce downtime** (if needed - should be minimal)
3. **Database migration** (5-10 minutes)
   ```bash
   # Backup first
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

   # Run migrations
   psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_statistics_mv.sql
   psql $DATABASE_URL -f scripts/migrations/20251125_create_attendance_functions.sql
   ```
4. **Deploy API + UI** (5 minutes)
   ```bash
   npm run build
   npm run deploy
   ```
5. **Verify deployment**
   - Check health endpoints
   - Test statistics loading
   - Monitor error rates
6. **Monitor for 1 hour**
   - Watch error logs
   - Check performance metrics
   - User feedback
7. **Announce completion**

**Rollback Procedure:**
If critical issues are detected:
```bash
# 1. Revert code deployment
vercel rollback

# 2. Drop database objects
psql $DATABASE_URL <<EOF
DROP MATERIALIZED VIEW IF EXISTS attendance_statistics_summary CASCADE;
DROP FUNCTION IF EXISTS get_member_attendance_stats CASCADE;
DROP FUNCTION IF EXISTS get_attendance_trends CASCADE;
EOF

# 3. Restore from backup (if needed)
psql $DATABASE_URL < backup_TIMESTAMP.sql
```

**Deliverables:**
- Technical documentation
- Migration guide
- User guide
- Deployment checklist
- Rollback procedure

---

## Performance Impact

### Before Optimization

| Metric | Value |
|--------|-------|
| **Database Queries** | 52 queries (N+1 patterns) |
| **API Response Time** | 2-5 seconds |
| **Page Load Time** | 3-7 seconds (includes auto-load stats) |
| **User Wait Time** | Always waits for stats (even if not needed) |
| **Database Load** | High (multiple sequential queries) |
| **Scalability** | Poor (O(N) queries per member) |

### After Optimization

| Metric | Value | Improvement |
|--------|-------|-------------|
| **Database Queries** | 3-5 queries | **90% reduction** |
| **API Response Time** | 50-100ms | **95% faster** |
| **Page Load Time** | 500ms-1s (no auto-load) | **80% faster** |
| **User Wait Time** | Only when stats requested | **Optional loading** |
| **Database Load** | Low (parallel queries) | **Significantly reduced** |
| **Scalability** | Excellent (O(1) complexity) | **Handles 1000+ members** |

### Performance Comparison

**Scenario: 20 members, 30 training sessions**

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Initial page load | 8 queries, 3s | 3 queries, 0.5s | 83% faster |
| Expand statistics | 52 queries, 2-5s | 2 queries, 50-100ms | 98% faster |
| Change category | 60+ queries, 5-8s | 5 queries, 0.6s | 92% faster |
| Record attendance | 2 queries, 0.5s | 2 queries, 0.5s | No change |

**Scenario: 100 members, 100 training sessions**

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Initial page load | 15 queries, 8s | 3 queries, 0.5s | 94% faster |
| Expand statistics | 202 queries, 30-60s | 2 queries, 100-200ms | 99.7% faster |

### Database Load Reduction

**Before:**
```
Members: 1 query
Sessions: 1 query
For each member (N):
  - Attendance query: N queries
For each session (M):
  - Attendance query: M queries
Total: 2 + N + M queries (Sequential)
```

**After:**
```
Summary: 1 query (materialized view)
Member stats: 1 query (single aggregation function)
Trends: 1 query (single aggregation function)
Total: 3 queries (Parallel)
```

### User Experience Impact

| Aspect | Before | After |
|--------|--------|-------|
| **First Impression** | Slow page load, long wait | Fast, immediate usability |
| **Unnecessary Waits** | Always loads stats | Only when needed |
| **Responsiveness** | Laggy, blocking UI | Smooth, non-blocking |
| **Control** | No choice when stats load | User decides when to view |
| **Feedback** | Unclear loading state | Clear tabs and loading states |

---

## Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Migration Failure** | Low | High | Test in staging, prepare rollback, backup data |
| **Materialized View Lag** | Medium | Low | Triggers auto-refresh, acceptable 1-2s lag |
| **Cache Invalidation Issues** | Medium | Medium | Manual refresh button, short TTL (5 min) |
| **PostgreSQL Function Bugs** | Low | Medium | Extensive testing, SQL unit tests |
| **API Endpoint Errors** | Low | Medium | Error handling, fallback to old method |
| **React Query Issues** | Low | Low | Well-established library, extensive docs |
| **Performance Regression** | Low | High | Load testing before deploy, monitoring |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **User Confusion** | Medium | Low | User guide, clear UI, gradual rollout |
| **Temporary Downtime** | Low | Medium | Off-hours deployment, < 10 min window |
| **Data Inconsistency** | Low | High | Transaction safety, testing, rollback plan |
| **Training Required** | Low | Low | Minimal UI changes, intuitive tabs |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Increased Maintenance** | Low | Low | Well-documented, follows existing patterns |
| **Database Size Growth** | Medium | Low | Materialized views are small, monitor size |
| **Trigger Performance** | Low | Medium | Non-blocking refresh, use CONCURRENTLY |

### Mitigation Strategies

**1. Comprehensive Testing**
- Unit tests for database functions
- Integration tests for API
- E2E tests for UI
- Load testing before production

**2. Gradual Rollout**
- Deploy to staging first
- Test with subset of users
- Monitor metrics closely
- Be prepared to rollback

**3. Monitoring**
- Set up alerts for slow queries
- Track API response times
- Monitor materialized view refresh times
- Log errors prominently

**4. Documentation**
- Clear technical docs
- User guides
- Troubleshooting procedures
- Rollback instructions

**5. Backup & Recovery**
- Database backups before migration
- Code version control
- Ability to rollback quickly
- Test recovery procedures

---

## Testing Strategy

### Unit Tests

**Database Functions:**
```sql
-- Test member stats function
DO $$
DECLARE
  v_result RECORD;
BEGIN
  -- Insert test data
  -- Call function
  -- Assert results
END $$;
```

**API Endpoint:**
```typescript
describe('GET /api/attendance/statistics', () => {
  it('should return correct structure', async () => {
    const response = await request(app)
      .get('/api/attendance/statistics')
      .query({categoryId: 'test', seasonId: 'test'});

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('summary');
    expect(response.body).toHaveProperty('memberStats');
    expect(response.body).toHaveProperty('trends');
  });

  it('should validate required parameters', async () => {
    const response = await request(app)
      .get('/api/attendance/statistics');

    expect(response.status).toBe(400);
  });

  it('should handle database errors gracefully', async () => {
    // Mock database error
    // Verify error response
  });
});
```

**React Query Hook:**
```typescript
describe('useAttendanceStatistics', () => {
  it('should fetch statistics when enabled', async () => {
    const {result, waitFor} = renderHook(() =>
      useAttendanceStatistics('cat-id', 'season-id')
    );

    await waitFor(() => result.current.isSuccess);
    expect(result.current.data).toBeDefined();
  });

  it('should not fetch when disabled', () => {
    const {result} = renderHook(() =>
      useAttendanceStatistics(undefined, undefined)
    );

    expect(result.current.isFetching).toBe(false);
  });

  it('should cache results', async () => {
    // First fetch
    // Second fetch
    // Verify cache hit
  });
});
```

### Integration Tests

**End-to-End Flow:**
```typescript
describe('Attendance Statistics Flow', () => {
  beforeEach(async () => {
    // Setup test database
    // Create test data (category, season, members, sessions, attendance)
  });

  it('should complete full statistics workflow', async () => {
    // 1. Navigate to attendance page
    await page.goto('/coaches/attendance');

    // 2. Select category and season
    await page.selectOption('[name="category"]', testCategoryId);
    await page.selectOption('[name="season"]', testSeasonId);

    // 3. Verify attendance recording tab loads fast
    const loadTime = await measureLoadTime();
    expect(loadTime).toBeLessThan(1000);

    // 4. Click statistics tab
    await page.click('text=Statistics & Analytics');

    // 5. Verify statistics load
    await page.waitForSelector('[data-testid="statistics-summary"]');
    const statsLoadTime = await measureLoadTime();
    expect(statsLoadTime).toBeLessThan(500);

    // 6. Verify data is displayed
    const summaryText = await page.textContent('[data-testid="completed-sessions"]');
    expect(summaryText).toContain('10'); // Expected 10 sessions

    // 7. Switch back to attendance tab
    await page.click('text=Attendance Recording');

    // 8. Record attendance
    await page.click('[data-testid="mark-present-button"]');

    // 9. Switch back to statistics
    await page.click('text=Statistics & Analytics');

    // 10. Verify statistics updated
    // (should see cache invalidation and refresh)
  });

  it('should handle errors gracefully', async () => {
    // Mock API error
    // Navigate to statistics tab
    // Verify error message displayed
    // Verify retry button works
  });
});
```

### Performance Tests

**Load Testing:**
```javascript
// k6 load test script
import http from 'k6/http';
import {check, sleep} from 'k6';

export let options = {
  stages: [
    {duration: '1m', target: 10}, // Ramp up to 10 users
    {duration: '3m', target: 10}, // Stay at 10 users
    {duration: '1m', target: 50}, // Ramp up to 50 users
    {duration: '5m', target: 50}, // Stay at 50 users
    {duration: '1m', target: 0}   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01']    // Less than 1% errors
  }
};

export default function () {
  const response = http.get(
    'http://localhost:3000/api/attendance/statistics?categoryId=X&seasonId=Y'
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has summary': (r) => JSON.parse(r.body).summary !== undefined
  });

  sleep(1);
}
```

**Database Performance:**
```sql
-- Enable query timing
\timing on

-- Test materialized view query
EXPLAIN ANALYZE
SELECT * FROM attendance_statistics_summary
WHERE category_id = 'test-id' AND season_id = 'test-id';
-- Expected: < 10ms, Index Scan

-- Test member stats function
EXPLAIN ANALYZE
SELECT * FROM get_member_attendance_stats('test-id', 'test-id');
-- Expected: < 100ms, aggregation

-- Test trends function
EXPLAIN ANALYZE
SELECT * FROM get_attendance_trends('test-id', 'test-id', 30);
-- Expected: < 100ms, aggregation

-- Check materialized view refresh time
\timing on
REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_statistics_summary;
-- Expected: < 2 seconds
```

### Acceptance Criteria

**Before going to production, all of these must pass:**

- [ ] **Functionality**
  - [ ] Statistics display correctly for all test cases
  - [ ] All statistics match expected calculations
  - [ ] Insights and recommendations are accurate
  - [ ] Charts render properly
  - [ ] Member performance table sortable and filterable

- [ ] **Performance**
  - [ ] Initial page load < 1 second
  - [ ] Statistics load < 500ms
  - [ ] API response time p95 < 500ms
  - [ ] Database queries ≤ 3 for statistics
  - [ ] Materialized view refresh < 2 seconds
  - [ ] No N+1 queries in logs

- [ ] **User Experience**
  - [ ] Tabs work smoothly
  - [ ] Lazy loading works (no auto-load)
  - [ ] Loading states clear
  - [ ] Error messages helpful
  - [ ] Mobile responsive
  - [ ] Keyboard navigation works

- [ ] **Reliability**
  - [ ] Cache invalidation works
  - [ ] Materialized view auto-refreshes
  - [ ] Error handling prevents crashes
  - [ ] Graceful degradation if stats unavailable
  - [ ] No console errors

- [ ] **Code Quality**
  - [ ] All unit tests pass (>80% coverage)
  - [ ] All integration tests pass
  - [ ] Linting passes
  - [ ] Type checking passes
  - [ ] No security vulnerabilities

- [ ] **Documentation**
  - [ ] Technical docs complete
  - [ ] User guide written
  - [ ] Migration guide ready
  - [ ] Code comments added
  - [ ] API documented

- [ ] **Operations**
  - [ ] Monitoring in place
  - [ ] Alerts configured
  - [ ] Rollback tested
  - [ ] Database backup taken
  - [ ] Deployment checklist complete

---

## Conclusion

This refactoring plan provides a comprehensive solution to the attendance statistics performance problems. The hybrid approach combining materialized views, PostgreSQL functions, lazy loading, and client-side caching will deliver:

- **96% reduction in database queries**
- **95% faster load times**
- **Better user experience** with on-demand statistics
- **Improved scalability** to handle large datasets
- **Maintainable architecture** following existing patterns

The implementation is divided into 5 phases over 5 weeks, with clear deliverables, testing strategies, and risk mitigation plans. The solution has been designed to be:

- **Low risk**: Follows existing patterns (materialized views like teams)
- **Backward compatible**: Can rollback if needed
- **Well-tested**: Comprehensive testing at all levels
- **Well-documented**: Technical and user documentation
- **User-friendly**: Better UX with lazy-loaded tabs

**Next Steps:**
1. Review and approve this plan
2. Allocate resources (1 developer, 5 weeks)
3. Begin Phase 1 (Database Layer)
4. Regular progress reviews
5. Staged deployment (staging → production)

---

**Document Status:** Draft for Review
**Last Updated:** 2025-11-24
**Author:** Development Team
**Reviewers:** [To be assigned]
