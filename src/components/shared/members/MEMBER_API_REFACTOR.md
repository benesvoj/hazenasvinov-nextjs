# Member API Refactor — Type-Specific Creation Endpoints

**Created:** 2026-03-10

## Problem

Creating a member through `MemberFormModal` inserts a row in `members` but **no row in `member_club_relationships`**. This means the member doesn't appear in `members_internal` view (which requires `INNER JOIN member_club_relationships`).

The current workaround — threading `clubId` from page → modal → hook → `useMembers().createMember()` — is fragile:
- No hook provides the own club ID in the coach portal
- `useMemberSave` (the old save flow) also doesn't pass `clubId`
- Future member types (external, on-loan) need different relationship configurations

## Current API Structure

| Endpoint | Method | Purpose | Creates Relationship? |
|---|---|---|---|
| `/api/members` | POST | Generic member insert | No |
| `/api/members/{id}/relationships` | POST | Separate relationship creation | Yes (manual) |
| `/api/members/internal` | GET | Read from `members_internal` view | N/A |
| `/api/members/external` | GET | Read from `members_external` view | N/A |
| `/api/members/on-loan` | GET | Read from `members_on_loan` view | N/A |

**Problem:** GET routes are type-specific but POST is generic. The client must orchestrate 2 API calls (create member + create relationship) and somehow know the correct `clubId`, `relationshipType`, and `status`.

## Proposed Solution: Type-Specific POST Endpoints

Align POST routes with the existing GET routes. Each endpoint creates the member **and** the correct relationship in a single server-side transaction.

### New Endpoints

#### `POST /api/members/internal`

Creates a member + auto-creates `own_member` relationship with the own club.

```
Request body: MemberInsert (same as current POST /api/members)
Server-side:
  1. Lookup own club: SELECT id FROM clubs WHERE is_own_club = true LIMIT 1
  2. INSERT into members
  3. INSERT into member_club_relationships:
     - club_id: <own club id>
     - relationship_type: 'own_member'
     - status: 'active'
     - valid_from: today
  4. Return created member
```

**Used by:** Coach members page, admin members page, lineup member creation — all internal member flows.

**Key benefit:** No `clubId` needed from the client. The server resolves it.

#### `POST /api/members/external` (future)

Creates a member + relationship with a specified external club.

```
Request body: MemberInsert + { clubId: string }
Server-side:
  1. Validate clubId exists and is_own_club = false
  2. INSERT into members
  3. INSERT into member_club_relationships:
     - club_id: <provided clubId>
     - relationship_type: 'external_player'
     - status: 'active'
     - valid_from: today
  4. Return created member
```

**Used by:** Future external player management.

#### `POST /api/members/on-loan` (future)

Creates a member + loan relationship with validity period.

```
Request body: MemberInsert + { clubId: string, validFrom: string, validTo: string }
Server-side:
  1. Validate clubId exists
  2. INSERT into members
  3. INSERT into member_club_relationships:
     - club_id: <provided clubId>
     - relationship_type: 'on_loan'
     - status: 'active'
     - valid_from: <provided>
     - valid_to: <provided>
  4. Return created member
```

**Used by:** Future on-loan player management.

---

## Implementation Plan

### Phase 1: POST /api/members/internal (unblocks current work)

| Step | File | Action |
|---|---|---|
| 1.1 | `src/app/api/members/internal/route.ts` | Add `POST` handler: lookup own club, insert member, create relationship |
| 1.2 | `src/lib/api-routes.ts` | No change needed — `members.internal` route already exists |
| 1.3 | `src/hooks/entities/member/state/useMembers.ts` | Add `createInternalMember(formData, categoryId)` — calls `POST /api/members/internal` |
| 1.4 | `src/hooks/entities/member/state/useMemberForm.ts` | Replace `createMember(data, categoryId, clubId!)` with `createInternalMember(data, categoryId)`. Remove `clubId` parameter. |
| 1.5 | `src/components/shared/members/modals/MemberFormModal.tsx` | Remove `clubId` from destructuring (if added) |
| 1.6 | `src/types/entities/member/state/memberFormModal.ts` | Remove `clubId` from `MemberFormModalProps` (if added) |

### Phase 2: Cleanup old flow

| Step | File | Action |
|---|---|---|
| 2.1 | `src/hooks/entities/member/business/useMemberSave.ts` | Migrate to use `createInternalMember` instead of `createMember` (which also doesn't create relationship) |
| 2.2 | `src/hooks/entities/member/state/useMembers.ts` | Deprecate `clubId` parameter in `createMember` — keep for backward compatibility until all consumers migrated |

### Phase 3: Future endpoints (when needed)

| Step | File | Action |
|---|---|---|
| 3.1 | `src/app/api/members/external/route.ts` | Add `POST` handler for external members |
| 3.2 | `src/app/api/members/on-loan/route.ts` | Add `POST` handler for on-loan members |
| 3.3 | `src/hooks/entities/member/state/useMembers.ts` | Add `createExternalMember`, `createOnLoanMember` |

---

## API Route Implementation Detail

### `POST /api/members/internal` — Full Specification

```typescript
// src/app/api/members/internal/route.ts

export async function POST(request: NextRequest) {
  return withAuth(async (user, supabase, admin) => {
    const body: MemberInsert = await request.json();

    // 1. Find own club
    const { data: ownClub, error: clubError } = await admin
      .from('clubs')
      .select('id')
      .eq('is_own_club', true)
      .single();

    if (clubError || !ownClub) {
      throw new Error('Own club not found');
    }

    // 2. Create member
    const { data: member, error: memberError } = await admin
      .from('members')
      .insert({ ...body })
      .select()
      .single();

    if (memberError) throw memberError;

    // 3. Create own_member relationship
    const { error: relError } = await admin
      .from('member_club_relationships')
      .insert({
        member_id: member.id,
        club_id: ownClub.id,
        relationship_type: 'own_member',
        status: 'active',
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: null,
      });

    if (relError) {
      // Member created but relationship failed — log error but don't roll back
      // The member exists, admin can fix relationship manually
      console.error('Failed to create relationship for member:', member.id, relError);
    }

    return successResponse(member, 201);
  });
}
```

### Auth Decision

Use `withAuth` (not `withAdminAuth`) because coaches also need to create members. The current `POST /api/members` uses `withAdminAuth` which would block coach portal usage.

**Future consideration:** Add coach role check via `hasCoachRole()` to prevent unauthenticated access while allowing both admin and coach roles.

---

## Hook Changes

### `useMembers` — New Method

```typescript
const createInternalMember = useCallback(
  async (formData: MemberFormData, categoryId?: string | null): Promise<Member> => {
    if (!validateForm(formData)) {
      throw new Error(tMembers.toasts.formContainsError);
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(API_ROUTES.members.internal, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          registration_number: formData.registration_number.trim(),
          date_of_birth: formData.date_of_birth ?? null,
          sex: formData.gender,
          functions: formData.functions,
          category_id: categoryId || null,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showToast.danger(tMembers.toasts.failedToCreateMember);
        throw new Error(result.error);
      }

      const convertedMember = convertSchemaToMember(result.data);
      showToast.success(tMembers.toasts.memberCreatedSuccessfully);
      return convertedMember;
    } catch (error) {
      console.error('Error creating internal member:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  },
  [validateForm]
);
```

### `useMemberForm` — Simplified

```typescript
// Remove clubId parameter entirely
export function useMemberForm() {
  // ...
  const { createInternalMember, updateMember } = useMembers();

  const handleSubmit = async () => {
    // ...
    const member = form.modalMode === ModalMode.ADD
      ? await createInternalMember({...}, form.formData.category_id)
      : await updateMember({...});
    // ...
  };
}
```

---

## Impact on MemberFormModal Consumers

| Consumer | Current `clubId` source | After refactor |
|---|---|---|
| Coach members page | None (broken) | Works — no `clubId` needed |
| Admin members page | None (broken) | Works — no `clubId` needed |
| LineupMemberAssignDialog | None (broken) | Works — no `clubId` needed |
| UnifiedPlayerManager (admin matches) | Passes `clubId` prop | Needs separate evaluation — may use `createInternalMember` or future `createExternalMember` |

---

## Relationship to members_internal View

The `members_internal` view requires:

```sql
INNER JOIN member_club_relationships mcr ON m.id = mcr.member_id
INNER JOIN clubs c ON mcr.club_id = c.id
WHERE
  c.is_own_club = true
  AND mcr.relationship_type = 'own_member'
  AND mcr.status = 'active'
  AND (mcr.valid_to IS NULL OR mcr.valid_to > CURRENT_DATE)
```

`POST /api/members/internal` creates exactly the row this view needs:
- `club_id` → own club (`is_own_club = true`)
- `relationship_type` → `'own_member'`
- `status` → `'active'`
- `valid_to` → `null` (no expiration)

---

## Decision Log

| Decision | Rationale |
|---|---|
| Server-side own club lookup | No client needs to know or pass `clubId` for internal members |
| Don't roll back member on relationship failure | Member record is valid; relationship can be fixed manually. Avoids complex transaction handling. |
| Use `withAuth` not `withAdminAuth` | Coaches need to create members from coach portal |
| Separate POST per member type | Each type has different relationship config. Prevents overloaded generic endpoint. |
| Keep existing `POST /api/members` | Backward compatibility. Generic endpoint may still be useful for admin tools. |
| Phase 3 deferred | External and on-loan creation not needed yet. Build when the feature is developed. |