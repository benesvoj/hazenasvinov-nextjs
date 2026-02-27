# Coach Request System - Implementation Plan

## Executive Summary

This document outlines the plan for implementing a ticket/request system that allows coaches to submit requests (issues, feature suggestions, improvements) to administrators. The system will leverage the existing todo infrastructure while adding coach-specific features.

---

## Current State Analysis

### Existing Todo System
The codebase already has a basic todo/comment system located in:
- **Database:** `scripts/development/create-todos-table.sql`
- **Types:** `src/types/components/todo.ts`, `src/types/components/comment.ts`
- **Hooks:** `src/hooks/admin/useTodos.ts`, `src/hooks/admin/useComments.ts`
- **Components:** `src/components/features/admin/ToDoList.tsx`, `src/components/features/admin/CommentsZone.tsx`
- **UI:** Admin dashboard at `src/app/admin/page.tsx`

**Current Todo Features:**
- Priority levels: low, medium, high, urgent
- Status tracking: todo, in-progress, done
- Categories: feature, bug, improvement, technical
- User assignment via `created_by` field
- Basic RLS policies for authenticated users

**Limitations for Coach Requests:**
- No distinction between admin-created todos and coach requests
- No assignment/routing mechanism to specific admins
- No response/feedback mechanism from admins to coaches
- No visibility for coaches to track their submitted requests
- No notification system for new requests

---

## Recommended Solution

### Option A: Extend Existing Todo System (Recommended)

**Rationale:**
- Reuses existing UI components and patterns
- Leverages current todo infrastructure
- Minimal code duplication
- Faster implementation
- Consistent admin experience

**Approach:**
Add fields to distinguish coach requests from regular todos and enable two-way communication.

### Option B: Create Separate Request System

**Rationale:**
- Complete separation of concerns
- More flexibility for future features
- Cleaner data model
- Better suited if requirements diverge significantly

**Note:** This plan will focus on **Option A** as it's more pragmatic given the existing infrastructure.

---

## Implementation Plan

### Phase 1: Database Schema Extension

#### 1.1 Modify Todos Table

Create migration file: `scripts/migrations/20251016_extend_todos_for_coach_requests.sql`

```sql
-- Add new columns to support coach requests
ALTER TABLE todos ADD COLUMN IF NOT EXISTS request_source VARCHAR(20)
    DEFAULT 'admin'
    CHECK (request_source IN ('admin', 'coach', 'system'));

ALTER TABLE todos ADD COLUMN IF NOT EXISTS assigned_to UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE todos ADD COLUMN IF NOT EXISTS resolved_by UUID
    REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE todos ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE todos ADD COLUMN IF NOT EXISTS coach_visible BOOLEAN
    DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_request_source ON todos(request_source);
CREATE INDEX IF NOT EXISTS idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX IF NOT EXISTS idx_todos_created_by ON todos(created_by);
CREATE INDEX IF NOT EXISTS idx_todos_status_priority ON todos(status, priority);

-- Update RLS policies
-- Allow coaches to read their own requests
CREATE POLICY "Coaches can view their own requests"
    ON todos FOR SELECT
    USING (
        auth.uid() = created_by
        AND request_source = 'coach'
    );

-- Allow coaches to insert requests
CREATE POLICY "Coaches can create requests"
    ON todos FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND request_source = 'coach'
        AND EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role IN ('coach', 'head_coach')
        )
    );

-- Allow coaches to update only their own pending requests
CREATE POLICY "Coaches can update their own pending requests"
    ON todos FOR UPDATE
    USING (
        auth.uid() = created_by
        AND request_source = 'coach'
        AND status = 'todo'
    );

-- Admins can see all todos (existing policy should cover this)
-- Admins can update any todo (existing policy should cover this)
```

#### 1.2 Create Request Responses Table

```sql
-- Create table for admin responses to coach requests
CREATE TABLE IF NOT EXISTS request_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    responded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_visible_to_coach BOOLEAN DEFAULT TRUE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_request_responses_request_id
    ON request_responses(request_id);

-- RLS policies
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;

-- Coaches can read responses to their requests
CREATE POLICY "Coaches can view responses to their requests"
    ON request_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM todos
            WHERE todos.id = request_responses.request_id
            AND todos.created_by = auth.uid()
            AND is_visible_to_coach = TRUE
        )
    );

-- Admins can manage all responses
CREATE POLICY "Admins can manage responses"
    ON request_responses FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

---

### Phase 2: Type Definitions & Enums

#### 2.1 Extend Todo Types

File: `src/types/components/todo.ts`

```typescript
// Add new fields to existing TodoItem interface
export interface TodoItem {
  // ... existing fields ...
  request_source?: 'admin' | 'coach' | 'system';
  assigned_to?: string;
  resolved_by?: string;
  resolved_at?: string;
  coach_visible?: boolean;
}

// New interface for coach requests specifically
export interface CoachRequest extends TodoItem {
  request_source: 'coach';
  responses?: RequestResponse[];
}

export interface RequestResponse {
  id: string;
  request_id: string;
  response_text: string;
  responded_by: string;
  responder_name?: string;
  created_at: string;
  is_visible_to_coach: boolean;
}
```

#### 2.2 Create Request Enums

File: `src/enums/requestSource.ts`

```typescript
export enum RequestSource {
  ADMIN = 'admin',
  COACH = 'coach',
  SYSTEM = 'system',
}
```

---

### Phase 3: Backend API

#### 3.1 Create Request API Endpoint

File: `src/app/api/coach-requests/route.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get requests for current user (coaches see their own, admins see all)
}

export async function POST(request: NextRequest) {
  // Create new coach request
  // Validate user is a coach
  // Insert into todos table with request_source = 'coach'
}

export async function PATCH(request: NextRequest) {
  // Update request status (admins only) or edit request (coach, if pending)
}

export async function DELETE(request: NextRequest) {
  // Delete request (coaches can delete their own pending requests, admins can delete any)
}
```

#### 3.2 Create Response API Endpoint

File: `src/app/api/coach-requests/responses/route.ts`

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Admins add responses to coach requests
}

export async function PATCH(request: NextRequest) {
  // Update response (admins only)
}

export async function DELETE(request: NextRequest) {
  // Delete response (admins only)
}
```

---

### Phase 4: Frontend Hooks

#### 4.1 Create useCoachRequests Hook

File: `src/hooks/coaches/useCoachRequests.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { CoachRequest, RequestResponse } from '@/types/components/todo';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export const useCoachRequests = () => {
  const [requests, setRequests] = useState<CoachRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load coach's own requests
  const loadRequests = useCallback(async () => {
    // Fetch from todos where request_source = 'coach' and created_by = current user
  }, []);

  // Create new request
  const createRequest = useCallback(async (data: Partial<CoachRequest>) => {
    // POST to /api/coach-requests
  }, []);

  // Update request (only if pending)
  const updateRequest = useCallback(async (id: string, updates: Partial<CoachRequest>) => {
    // PATCH to /api/coach-requests
  }, []);

  // Delete request (only if pending)
  const deleteRequest = useCallback(async (id: string) => {
    // DELETE to /api/coach-requests
  }, []);

  // Load responses for a specific request
  const loadResponses = useCallback(async (requestId: string) => {
    // GET from request_responses table
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    createRequest,
    updateRequest,
    deleteRequest,
    loadRequests,
    loadResponses,
  };
};
```

#### 4.2 Extend useAdminTodos Hook

File: `src/hooks/admin/useTodos.ts`

Add methods to handle coach requests:
- Filter todos by `request_source`
- Assign requests to admins
- Add responses to requests
- Mark requests as resolved

---

### Phase 5: Coach UI Components

#### 5.1 Create Coach Request Form Component

File: `src/components/features/coaches/CoachRequestForm.tsx`

```typescript
// Modal form for creating/editing coach requests
// Fields:
// - Title (required)
// - Description (textarea, required)
// - Category (select: bug, feature, improvement, technical)
// - Priority (select: low, medium, high, urgent)
// - Optional: Attach screenshot/file reference
```

#### 5.2 Create Coach Request List Component

File: `src/components/features/coaches/CoachRequestList.tsx`

```typescript
// Display list of coach's requests
// Features:
// - Filter by status (pending, in-progress, done)
// - Sort by date, priority
// - Visual indicators for status and priority
// - Click to view details and responses
// - Edit button (only for pending requests)
// - Delete button (only for pending requests)
```

#### 5.3 Create Request Detail Modal

File: `src/components/features/coaches/RequestDetailModal.tsx`

```typescript
// Show full request details
// - All request fields
// - Timeline of responses from admins
// - Status history
// - Option to close if pending
```

---

### Phase 6: Admin UI Components

#### 6.1 Create Admin Request Queue Component

File: `src/components/features/admin/AdminRequestQueue.tsx`

```typescript
// Display all coach requests
// Features:
// - Filter by status, priority, category, coach
// - Sort by date, priority
// - Assign to admin
// - Quick status update
// - Add response
// - Visual badge for new/unassigned requests
```

#### 6.2 Create Admin Request Detail Modal

File: `src/components/features/admin/AdminRequestDetailModal.tsx`

```typescript
// Full request management
// - View all details
// - Change status
// - Assign to admin
// - Add/edit responses
// - Mark as resolved
// - View coach information
// - Internal notes (not visible to coach)
```

#### 6.3 Update Existing Admin Dashboard

File: `src/app/admin/page.tsx`

Add:
- "Coach Requests" tab alongside Todos and Comments
- Badge showing count of pending/unassigned requests
- Quick stats: new requests today, high-priority pending, etc.

---

### Phase 7: Coach Portal Pages

#### 7.1 Create Coach Requests Page

File: `src/app/coaches/requests/page.tsx`

```typescript
'use client';

import { useCoachRequests } from '@/hooks/coaches/useCoachRequests';
import { CoachRequestList } from '@/components/features/coaches/CoachRequestList';
import { CoachRequestForm } from '@/components/features/coaches/CoachRequestForm';

export default function CoachRequestsPage() {
  // Page layout:
  // - Header with "New Request" button
  // - Filter/sort controls
  // - Request list
  // - Statistics cards (pending, in-progress, completed)
}
```

#### 7.2 Update Coach Navigation

File: `src/app/coaches/components/CoachSidebar.tsx` (or equivalent)

Add:
- "My Requests" link with badge showing pending count
- Icon: ticket or message icon

---

### Phase 8: Admin Portal Pages

#### 8.1 Create Admin Coach Requests Page (Optional)

File: `src/app/admin/coach-requests/page.tsx`

```typescript
// Full-featured request management page
// Alternative to embedding in main dashboard
// Benefits:
// - More space for detailed view
// - Advanced filtering and search
// - Bulk operations
// - Export to CSV
```

#### 8.2 Update Admin Navigation

Add "Coach Requests" to admin sidebar with badge

---

### Phase 9: Notifications (Optional Enhancement)

#### 9.1 Add Notification System

Options:
1. **In-app notifications** (simpler)
   - Badge counts on navigation
   - Toast notifications when page is active

2. **Email notifications** (more comprehensive)
   - Notify admins of new coach requests
   - Notify coaches of responses or status changes

3. **Real-time updates** (advanced)
   - Use Supabase Realtime subscriptions
   - Auto-refresh lists when data changes

**Recommended:** Start with in-app badges and toast notifications, add email later if needed.

---

### Phase 10: Testing & Documentation

#### 10.1 Testing Checklist

**Database:**
- [ ] Migration runs successfully
- [ ] RLS policies work correctly (coaches can only see their requests, admins see all)
- [ ] Indexes improve query performance
- [ ] Foreign key constraints work

**Coach Functionality:**
- [ ] Coach can create request
- [ ] Coach can view their requests
- [ ] Coach can edit pending request
- [ ] Coach can delete pending request
- [ ] Coach can see admin responses
- [ ] Coach cannot see other coaches' requests
- [ ] Coach cannot modify in-progress or completed requests

**Admin Functionality:**
- [ ] Admin can view all coach requests
- [ ] Admin can filter and sort requests
- [ ] Admin can assign requests to admins
- [ ] Admin can add responses
- [ ] Admin can change request status
- [ ] Admin can mark requests as resolved
- [ ] Admin sees request statistics

**Edge Cases:**
- [ ] Request deletion cascades to responses
- [ ] Assigned admin user deletion sets assigned_to to NULL
- [ ] Proper error handling for API failures
- [ ] Form validation works
- [ ] Toast notifications appear correctly

#### 10.2 Documentation

Create:
1. **User Guide for Coaches**
   - How to submit a request
   - What information to include
   - How to track request status
   - Expected response times

2. **Admin Guide**
   - How to triage requests
   - How to assign and respond
   - Priority guidelines
   - When to mark as resolved

3. **Developer Documentation**
   - API endpoints
   - Database schema
   - Component architecture
   - How to extend the system

---

## Implementation Timeline

### Week 1: Backend Foundation
- [ ] Create database migration
- [ ] Add type definitions
- [ ] Create API endpoints
- [ ] Test RLS policies

### Week 2: Frontend Core
- [ ] Create hooks
- [ ] Build coach request form
- [ ] Build coach request list
- [ ] Create request detail modal

### Week 3: Admin Interface
- [ ] Create admin request queue
- [ ] Build admin detail modal
- [ ] Update admin dashboard
- [ ] Add response functionality

### Week 4: Integration & Polish
- [ ] Integrate with navigation
- [ ] Add badges and notifications
- [ ] Test all workflows
- [ ] Fix bugs and refine UI

### Week 5: Documentation & Launch
- [ ] Write user guides
- [ ] Create developer docs
- [ ] Final testing
- [ ] Deploy to production

---

## Technical Considerations

### Security
- All requests filtered by user authentication via RLS
- Coaches can only access their own requests
- Admins verified via `user_profiles.role = 'admin'`
- Input validation on all forms
- SQL injection prevention via parameterized queries

### Performance
- Indexes on `request_source`, `assigned_to`, `created_by`, `status`, `priority`
- Pagination if request count grows large
- Lazy loading of responses

### Scalability
- Current design supports hundreds of coaches and thousands of requests
- Consider archiving old resolved requests after 1 year
- Add pagination when list exceeds 100 items

### Accessibility
- Keyboard navigation in forms and lists
- ARIA labels on interactive elements
- Screen reader support
- Color-blind friendly status indicators

### Mobile Responsiveness
- All components must work on mobile devices
- Touch-friendly buttons and controls
- Responsive layout for different screen sizes

---

## Alternative Approaches Considered

### 1. Separate Request System (Not Chosen)

**Pros:**
- Complete separation of concerns
- No impact on existing todos
- More flexibility

**Cons:**
- Code duplication
- Separate UI components
- Different patterns from existing system
- More complexity

### 2. Use Comments for Requests (Not Chosen)

**Pros:**
- Even simpler implementation
- Already exists

**Cons:**
- Comments lack structure (no status, priority, assignment)
- Poor UX for request tracking
- No filtering or organization
- Mixing concerns

### 3. External Ticket System (Not Chosen)

**Pros:**
- Feature-rich (Jira, Linear, etc.)
- Proven solutions

**Cons:**
- Additional cost
- Extra login for coaches
- Context switching
- Integration complexity
- Not tailored to needs

---

## Success Metrics

### Adoption
- % of coaches who submit at least one request in first month
- Number of requests submitted per week
- Average response time from admins

### Quality
- % of requests marked as resolved
- Average time to resolution
- Coach satisfaction (could add optional rating)

### Efficiency
- Admin time spent managing requests
- % of requests properly categorized
- Reduction in ad-hoc communication (email, messages)

---

## Future Enhancements (Out of Scope)

1. **Request Templates**
   - Pre-defined templates for common request types
   - Auto-populate fields based on template

2. **File Attachments**
   - Allow coaches to upload screenshots or documents
   - Store in Supabase Storage

3. **Request Voting**
   - Other coaches can upvote feature requests
   - Helps prioritize popular features

4. **SLA Tracking**
   - Define response time targets by priority
   - Alert admins when approaching deadline

5. **Public Roadmap**
   - Show coaches what features are planned
   - Link requests to roadmap items

6. **Request Analytics**
   - Dashboard showing request trends
   - Common categories and themes
   - Coach engagement metrics

7. **Email Integration**
   - Submit requests via email
   - Email notifications for updates

8. **API Webhooks**
   - Integrate with external tools (Slack, Discord)
   - Notify team channels of new requests

---

## Questions for Stakeholders

1. **Priority Levels**
   - Are the current 4 levels (low, medium, high, urgent) appropriate?
   - Should we add SLA targets for each priority?

2. **Assignment**
   - Should requests be auto-assigned based on category?
   - Or should admin manually assign?

3. **Visibility**
   - Should coaches see other coaches' requests?
   - Should there be a public request board?

4. **Categories**
   - Are current categories sufficient (bug, feature, improvement, technical)?
   - Should we add more specific categories?

5. **Notifications**
   - Email notifications required or just in-app?
   - Who gets notified and when?

6. **Archiving**
   - How long to keep resolved requests?
   - Should old requests be archived or deleted?

---

## Conclusion

This plan extends the existing todo system to support coach-to-admin requests with minimal code changes and maximum reuse. The implementation is straightforward, maintains consistency with existing patterns, and provides coaches with a clear channel to report issues and suggest improvements.

The phased approach allows for incremental delivery and testing, with the core functionality deliverable in 2-3 weeks and polish/documentation in weeks 4-5.

**Recommended Next Steps:**
1. Review and approve this plan with stakeholders
2. Answer open questions about requirements
3. Create database migration and test locally
4. Begin Phase 1 implementation

---

## Related Files Reference

### Key Existing Files to Reference
- `src/hooks/admin/useTodos.ts` - Todo management patterns
- `src/components/features/admin/ToDoList.tsx` - List UI patterns
- `src/app/admin/page.tsx` - Admin dashboard layout
- `src/app/coaches/dashboard/page.tsx` - Coach portal structure
- `scripts/development/create-todos-table.sql` - Current todo schema
- `src/types/components/todo.ts` - Todo type definitions

### Files to Create
- `scripts/migrations/20251016_extend_todos_for_coach_requests.sql`
- `src/app/api/coach-requests/route.ts`
- `src/app/api/coach-requests/responses/route.ts`
- `src/hooks/coaches/useCoachRequests.ts`
- `src/components/features/coaches/CoachRequestForm.tsx`
- `src/components/features/coaches/CoachRequestList.tsx`
- `src/components/features/coaches/RequestDetailModal.tsx`
- `src/components/features/admin/AdminRequestQueue.tsx`
- `src/app/coaches/requests/page.tsx`
- `src/enums/requestSource.ts`

---

**Document Version:** 1.0
**Date:** 2025-10-16
**Author:** Claude Code Analysis
**Status:** Proposal - Awaiting Approval
