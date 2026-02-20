# Coach Card API Implementation Plan

## Problem Statement

The `CoachCardEditor` component fails with **"Forbidden" (403)** error when coaches try to create their coach cards.

**Root Cause**: The generic entities API (`/api/entities/[entity]/route.ts`) uses `withAdminAuth` for ALL POST operations, ignoring the `requiresAdmin: false` configuration for `coach_cards`.

## Solution

Create a dedicated Coach Card API with role-based authorization that allows coaches to manage their own cards.

---

## Existing Resources to Reuse

### Queries (`src/queries/coachCards/queries.ts`)
- `getAllCoachCards(ctx, options)` - Get all cards with filtering
- `getCoachCardById(ctx, id)` - Get single card by ID
- `getCoachCardByUserId(ctx, userId)` - Get card by user ID ✅ **Perfect for fetching own card**
- `getPublishedCoachCadsByCategory(ctx, categoryId)` - Public cards by category

### Mutations (`src/queries/coachCards/mutations.ts`)
- `createCoachCard(ctx, data)` - Create new card ✅
- `updateCoachCard(ctx, id, data)` - Update existing card ✅
- `deleteCoachCard(ctx, id)` - Delete card ✅

### API Helpers (`src/utils/supabase/apiHelpers.ts`)
- `withAuth(handler)` - Requires authentication, returns user + supabase
- `withAdminAuth(handler)` - Requires admin role
- `withPublicAccess(handler)` - No auth required
- `errorResponse(message, status)` - Standard error response
- `successResponse(data, status)` - Standard success response
- `validateBody(body, requiredFields)` - Validate required fields

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/supabase/coachAuth.ts` | CREATE | Coach authorization helpers |
| `src/app/api/coach-cards/route.ts` | CREATE | GET own card, POST create card |
| `src/app/api/coach-cards/[id]/route.ts` | CREATE | GET/PUT/DELETE by ID |
| `src/hooks/entities/coach-card/state/useCoachCard.ts` | MODIFY | Use new API endpoints |
| `src/lib/api-routes.ts` | AUTO-GEN | Run `npm run generate:api-routes` |

---

## File 1: `src/utils/supabase/coachAuth.ts` (CREATE)

### Purpose
Reusable authorization helpers for coach-related operations.

### Code

```typescript
/**
 * @fileoverview Coach Authorization Helpers - SERVER ONLY
 *
 * Provides role checking and ownership verification for coach operations.
 * Import only in API routes.
 */

import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Roles that are considered "coach" roles
 */
export const COACH_ROLES = ['coach', 'head_coach', 'assistant_coach'] as const;
export type CoachRole = typeof COACH_ROLES[number];

/**
 * Check if user has a coach role
 *
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns true if user has coach role
 *
 * @example
 * const isCoach = await hasCoachRole(supabase, user.id);
 * if (!isCoach) {
 *   return errorResponse('Only coaches can perform this action', 403);
 * }
 */
export async function hasCoachRole(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (!profile?.role) return false;
  return COACH_ROLES.includes(profile.role as CoachRole);
}

/**
 * Check if user is admin
 *
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns true if user is admin
 */
export async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return profile?.role === 'admin';
}

/**
 * Check if user owns a specific coach card
 *
 * @param supabase - Supabase client
 * @param cardId - Coach card ID
 * @param userId - User ID to check
 * @returns true if user owns the card
 *
 * @example
 * const isOwner = await isCoachCardOwner(supabase, cardId, user.id);
 * if (!isOwner) {
 *   return errorResponse('You can only edit your own coach card', 403);
 * }
 */
export async function isCoachCardOwner(
  supabase: SupabaseClient,
  cardId: string,
  userId: string
): Promise<boolean> {
  const { data: card } = await supabase
    .from('coach_cards')
    .select('user_id')
    .eq('id', cardId)
    .single();

  return card?.user_id === userId;
}

/**
 * Combined authorization check for coach card operations
 *
 * @param supabase - Supabase client
 * @param cardId - Coach card ID
 * @param userId - User ID
 * @param operation - 'read' | 'write' | 'delete'
 * @returns Authorization result with reason if denied
 */
export async function checkCoachCardAccess(
  supabase: SupabaseClient,
  cardId: string,
  userId: string,
  operation: 'read' | 'write' | 'delete'
): Promise<{ allowed: boolean; reason?: string }> {
  const [ownerCheck, adminCheck] = await Promise.all([
    isCoachCardOwner(supabase, cardId, userId),
    isAdmin(supabase, userId),
  ]);

  // Owner can do everything with their own card
  if (ownerCheck) {
    return { allowed: true };
  }

  // Admin can read and delete, but NOT write (respect coach's personal data)
  if (adminCheck) {
    if (operation === 'write') {
      return { allowed: false, reason: 'Admins cannot edit coach personal cards' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'You do not have access to this coach card' };
}
```

---

## File 2: `src/app/api/coach-cards/route.ts` (CREATE)

### Purpose
Handle GET (fetch own card) and POST (create new card) operations.

### Endpoints
- `GET /api/coach-cards` - Get current user's coach card
- `POST /api/coach-cards` - Create new coach card

### Code

```typescript
import { NextRequest } from 'next/server';

import {
  errorResponse,
  successResponse,
  validateBody,
  withAuth,
} from '@/utils/supabase/apiHelpers';
import { hasCoachRole } from '@/utils/supabase/coachAuth';

import {
  createCoachCard,
  getCoachCardByUserId,
} from '@/queries/coachCards';

/**
 * GET /api/coach-cards
 *
 * Fetches the authenticated user's coach card.
 * Returns null data if no card exists (not an error).
 *
 * @returns { data: CoachCard | null, error: null }
 */
export async function GET() {
  return withAuth(async (user, supabase) => {
    const result = await getCoachCardByUserId({ supabase }, user.id);

    // "No card found" is not an error - user just hasn't created one yet
    // Supabase returns this error when .single() finds 0 rows
    if (result.error?.includes('PGRST116') ||
        result.error?.includes('Cannot coerce the result to a single JSON object') ||
        result.error?.includes('JSON object requested, multiple (or no) rows returned')) {
      return successResponse(null);
    }

    if (result.error) {
      console.error('[GET /api/coach-cards] Error:', result.error);
      return errorResponse(result.error, 500);
    }

    return successResponse(result.data);
  });
}

/**
 * POST /api/coach-cards
 *
 * Creates a new coach card for the authenticated user.
 *
 * Authorization:
 * - User must be authenticated
 * - User must have a coach role (coach, head_coach, assistant_coach)
 * - user_id in body must match authenticated user (enforced)
 * - User must not already have a coach card
 *
 * @body { name, surname, email?, phone?, note?, photo_url?, photo_path?, published_categories? }
 * @returns { data: CoachCard, error: null } with status 201
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase) => {
    // 1. Check if user has coach role
    const isCoach = await hasCoachRole(supabase, user.id);
    if (!isCoach) {
      return errorResponse('Only coaches can create coach cards', 403);
    }

    // 2. Parse and validate request body
    const body = await request.json();

    // Only name and surname are required - other fields are optional
    const validation = validateBody(body, ['name', 'surname']);
    if (!validation.valid) {
      return errorResponse(
        `Missing required fields: ${validation.missing.join(', ')}`,
        400
      );
    }

    // 3. Check if user already has a coach card
    const existingCard = await getCoachCardByUserId({ supabase }, user.id);
    if (existingCard.data) {
      return errorResponse('You already have a coach card. Use PUT to update it.', 409);
    }

    // 4. Force user_id to match authenticated user (prevent impersonation)
    const cardData = {
      ...body,
      user_id: user.id, // Always use authenticated user's ID
    };

    // 5. Create the coach card
    const result = await createCoachCard({ supabase }, cardData);

    if (result.error) {
      console.error('[POST /api/coach-cards] Error:', result.error);
      return errorResponse(result.error, 500);
    }

    return successResponse(result.data, 201);
  });
}
```

---

## File 3: `src/app/api/coach-cards/[id]/route.ts` (CREATE)

### Purpose
Handle GET, PUT, DELETE operations for a specific coach card by ID.

### Endpoints
- `GET /api/coach-cards/[id]` - Get specific card (owner or admin)
- `PUT /api/coach-cards/[id]` - Update card (owner only)
- `DELETE /api/coach-cards/[id]` - Delete card (owner or admin)

### Code

```typescript
import { NextRequest } from 'next/server';

import {
  errorResponse,
  prepareUpdateData,
  successResponse,
  withAuth,
} from '@/utils/supabase/apiHelpers';
import { checkCoachCardAccess } from '@/utils/supabase/coachAuth';

import {
  deleteCoachCard,
  getCoachCardById,
  updateCoachCard,
} from '@/queries/coachCards';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/coach-cards/[id]
 *
 * Fetches a specific coach card by ID.
 *
 * Authorization:
 * - Owner can read their own card
 * - Admin can read any card
 *
 * @returns { data: CoachCard, error: null }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withAuth(async (user, supabase) => {
    // Check access
    const access = await checkCoachCardAccess(supabase, id, user.id, 'read');
    if (!access.allowed) {
      return errorResponse(access.reason || 'Access denied', 403);
    }

    // Fetch the card
    const result = await getCoachCardById({ supabase }, id);

    if (result.error) {
      console.error(`[GET /api/coach-cards/${id}] Error:`, result.error);
      return errorResponse(result.error, 500);
    }

    if (!result.data) {
      return errorResponse('Coach card not found', 404);
    }

    return successResponse(result.data);
  });
}

/**
 * PUT /api/coach-cards/[id]
 *
 * Updates a coach card.
 *
 * Authorization:
 * - Only the owner can update their card
 * - Admins CANNOT update (respect coach's personal data)
 *
 * @body Partial<CoachCard> fields to update
 * @returns { data: CoachCard, error: null }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withAuth(async (user, supabase) => {
    // Check access - only owner can write
    const access = await checkCoachCardAccess(supabase, id, user.id, 'write');
    if (!access.allowed) {
      return errorResponse(access.reason || 'Access denied', 403);
    }

    // Parse request body
    const body = await request.json();

    // Prepare update data (excludes id, adds updated_at)
    // Also exclude user_id to prevent ownership transfer
    const updateData = prepareUpdateData(body, ['id', 'user_id', 'created_at']);

    // Update the card
    const result = await updateCoachCard({ supabase }, id, updateData);

    if (result.error) {
      console.error(`[PUT /api/coach-cards/${id}] Error:`, result.error);
      return errorResponse(result.error, 500);
    }

    return successResponse(result.data);
  });
}

/**
 * DELETE /api/coach-cards/[id]
 *
 * Deletes a coach card.
 *
 * Authorization:
 * - Owner can delete their own card
 * - Admin can delete any card
 *
 * @returns { data: { success: true }, error: null }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  return withAuth(async (user, supabase) => {
    // Check access
    const access = await checkCoachCardAccess(supabase, id, user.id, 'delete');
    if (!access.allowed) {
      return errorResponse(access.reason || 'Access denied', 403);
    }

    // Delete the card
    const result = await deleteCoachCard({ supabase }, id);

    if (result.error) {
      console.error(`[DELETE /api/coach-cards/${id}] Error:`, result.error);
      return errorResponse(result.error, 500);
    }

    return successResponse({ success: true });
  });
}
```

---

## File 4: `src/hooks/entities/coach-card/state/useCoachCard.ts` (MODIFY)

### Purpose
Update the hook to use the new dedicated API endpoints instead of the generic entities API.

### Current Code (lines 14-30)

```typescript
export function useCoachCard() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    CoachCard,
    CoachCardInsert
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.singular,
    messages: {
      createSuccess: translations.coachCards.responseMessages.createSuccess,
      updateSuccess: translations.coachCards.responseMessages.updateSuccess,
      deleteSuccess: translations.coachCards.responseMessages.deleteSuccess,
      createError: translations.coachCards.responseMessages.createError,
      updateError: translations.coachCards.responseMessages.updateError,
      deleteError: translations.coachCards.responseMessages.deleteError,
    },
  })();
  // ...
}
```

### New Code

```typescript
export function useCoachCard() {
  const {loading, error, create, update, deleteItem, setLoading} = createCRUDHook<
    CoachCard,
    CoachCardInsert
  >({
    // Changed: Use dedicated coach-cards API instead of generic entities API
    baseEndpoint: '/api/coach-cards',
    byIdEndpoint: (id) => `/api/coach-cards/${id}`,
    entityName: ENTITY.singular,
    messages: {
      createSuccess: translations.coachCards.responseMessages.createSuccess,
      updateSuccess: translations.coachCards.responseMessages.updateSuccess,
      deleteSuccess: translations.coachCards.responseMessages.deleteSuccess,
      createError: translations.coachCards.responseMessages.createError,
      updateError: translations.coachCards.responseMessages.updateError,
      deleteError: translations.coachCards.responseMessages.deleteError,
    },
  })();
  // ...
}
```

### Changes Summary
- Line 19: `API_ROUTES.entities.root(DB_TABLE)` → `'/api/coach-cards'`
- Line 20: `API_ROUTES.entities.byId(DB_TABLE, id)` → `\`/api/coach-cards/${id}\``

---

## File 5: `src/lib/api-routes.ts` (AUTO-GENERATED)

This file is auto-generated. After creating the new API routes, run:

```bash
npm run generate:api-routes
```

This will add:

```typescript
coachCards: {
  root: '/api/coach-cards' as const,
  public: '/api/coach-cards/public' as const,
  byId: (id: string | number) => `/api/coach-cards/${id}`,
},
```

---

## Supabase RLS Policies (VERIFY)

### Check Current Policies

```sql
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'coach_cards';
```

### Required Policies

If not already configured, create these policies:

```sql
-- Allow users to SELECT their own coach card
CREATE POLICY "coach_cards_select_own" ON coach_cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to INSERT their own coach card
CREATE POLICY "coach_cards_insert_own" ON coach_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own coach card
CREATE POLICY "coach_cards_update_own" ON coach_cards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own coach card
CREATE POLICY "coach_cards_delete_own" ON coach_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins full access (if admin function exists)
-- CREATE POLICY "coach_cards_admin_all" ON coach_cards
--   FOR ALL
--   USING (is_admin(auth.uid()));
```

---

## Implementation Checklist

### Phase 1: Authorization Helper
- [ ] Create `src/utils/supabase/coachAuth.ts`
- [ ] Export `COACH_ROLES`, `hasCoachRole`, `isAdmin`, `isCoachCardOwner`, `checkCoachCardAccess`

### Phase 2: API Routes
- [ ] Create `src/app/api/coach-cards/route.ts` (GET, POST)
- [ ] Create `src/app/api/coach-cards/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Test endpoints with coach user

### Phase 3: Hook Update
- [ ] Modify `src/hooks/entities/coach-card/state/useCoachCard.ts`
- [ ] Update `baseEndpoint` and `byIdEndpoint`

### Phase 4: Finalize
- [ ] Run `npm run generate:api-routes`
- [ ] Verify Supabase RLS policies
- [ ] Test full flow in CoachCardEditor

---

## Testing Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Coach creates their first card | 201 Created |
| Coach tries to create second card | 409 Conflict |
| Coach updates their card | 200 OK |
| Coach deletes their card | 200 OK |
| Admin tries to edit coach's card | 403 Forbidden |
| Admin deletes coach's card | 200 OK |
| Non-coach tries to create card | 403 Forbidden |
| Unauthenticated request | 401 Unauthorized |

---

## Authorization Matrix

| Operation | Owner | Admin | Coach (other) | Non-coach |
|-----------|-------|-------|---------------|-----------|
| GET own card | ✅ | ✅ | ❌ | ❌ |
| POST create | ✅ | ❌ | ❌ | ❌ |
| PUT update | ✅ | ❌ | ❌ | ❌ |
| DELETE | ✅ | ✅ | ❌ | ❌ |