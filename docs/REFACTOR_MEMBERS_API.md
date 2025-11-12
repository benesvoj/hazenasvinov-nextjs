# Refactoring Members CRUD: Moving from Client-Side DB Queries to API Routes

## Current Architecture Issues

### Problem Files
1. `src/hooks/entities/member/state/useMembers.ts` - Direct Supabase queries in client hook
2. `src/hooks/entities/member/business/useMemberClubRelationships.ts` - Same issue

### Why This Is Wrong
- **Security Risk**: Database structure exposed to client, bypassing server-side validation
- **Architecture Violation**: Next.js best practice is to use API routes for mutations
- **'use client' + Direct DB**: Client components should not perform direct database writes
- **Inconsistency**: Your codebase already uses API routes elsewhere (e.g., `/api/members/functions/route.ts`)

---

## Recommended Architecture

```
┌─────────────────┐      ┌──────────────┐      ┌─────────────────┐      ┌──────────────┐
│ Client Component│─────▶│ useMembers   │─────▶│ API Route       │─────▶│ Database     │
│ (React)         │      │ Hook         │      │ (Server-side)   │      │ (Supabase)   │
└─────────────────┘      └──────────────┘      └─────────────────┘      └──────────────┘
                              │                         │
                              │                         │
                              ▼                         ▼
                         fetch() calls           - Validation
                         - Loading state         - Authorization
                         - Error handling        - Business logic
                         - UI feedback           - DB queries
```

---

## Implementation Plan

### Step 1: Create API Routes

#### 1.1 Base CRUD Route: `/src/app/api/members/route.ts`

```typescript
import {NextResponse} from 'next/server';
import {createClient} from '@/utils/supabase/server';
import supabaseAdmin from '@/utils/supabase/admin';

// GET /api/members - List all members (already exists via other routes, optional)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase
      .from('members')
      .select('*')
      .order('surname', {ascending: true});

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

// POST /api/members - Create new member
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {name, surname, registration_number, date_of_birth, sex, functions, category_id} = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({error: 'Jméno je povinné'}, {status: 400});
    }
    if (!surname?.trim()) {
      return NextResponse.json({error: 'Příjmení je povinné'}, {status: 400});
    }
    if (!registration_number?.trim()) {
      return NextResponse.json({error: 'Registrační číslo je povinné'}, {status: 400});
    }

    // Insert member
    const {data, error} = await supabaseAdmin
      .from('members')
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        registration_number: registration_number.trim(),
        date_of_birth: date_of_birth ?? null,
        sex,
        functions,
        category_id: category_id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating member:', error);
      return NextResponse.json(
        {error: `Chyba při vytváření člena: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null}, {status: 201});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
```

#### 1.2 Individual Member Route: `/src/app/api/members/[id]/route.ts`

```typescript
import {NextResponse} from 'next/server';
import {createClient} from '@/utils/supabase/server';
import supabaseAdmin from '@/utils/supabase/admin';

// GET /api/members/[id] - Get single member
export async function GET(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase
      .from('members')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching member:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

// PATCH /api/members/[id] - Update member
export async function PATCH(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();

    // Filter out undefined values to avoid Supabase errors
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are not undefined
    Object.keys(body).forEach((key) => {
      const value = body[key];
      if (value !== undefined && key !== 'id') {
        updateData[key] = value;
      }
    });

    const {data, error} = await supabaseAdmin
      .from('members')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating member:', error);
      return NextResponse.json(
        {error: `Chyba při aktualizaci člena: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

// DELETE /api/members/[id] - Delete member
export async function DELETE(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {error} = await supabaseAdmin
      .from('members')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting member:', error);
      return NextResponse.json(
        {error: `Chyba při mazání člena: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({success: true, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
```

#### 1.3 Member-Club Relationships Route: `/src/app/api/members/[id]/relationships/route.ts`

```typescript
import {NextResponse} from 'next/server';
import {createClient} from '@/utils/supabase/server';
import supabaseAdmin from '@/utils/supabase/admin';
import {RelationshipType, RelationshipStatus} from '@/enums';

// POST /api/members/[id]/relationships - Create relationship
export async function POST(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();
    const {clubId, relationshipType, status, validFrom, validTo, notes} = body;

    if (!clubId) {
      return NextResponse.json({error: 'Club ID je povinné'}, {status: 400});
    }

    const {data, error} = await supabaseAdmin
      .from('member_club_relationships')
      .insert({
        member_id: params.id,
        club_id: clubId,
        relationship_type: relationshipType || RelationshipType.PERMANENT,
        status: status || RelationshipStatus.ACTIVE,
        valid_from: validFrom || new Date().toISOString().split('T')[0],
        valid_to: validTo || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating relationship:', error);
      return NextResponse.json(
        {error: `Chyba při vytváření vztahu: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null}, {status: 201});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

// GET /api/members/[id]/relationships - Get member's relationships
export async function GET(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {data, error} = await supabase
      .from('member_club_relationships')
      .select(`
        *,
        club:clubs(
          id,
          name,
          short_name
        )
      `)
      .eq('member_id', params.id)
      .order('created_at', {ascending: false});

    if (error) {
      console.error('Error fetching relationships:', error);
      return NextResponse.json({error: error.message}, {status: 500});
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
```

#### 1.4 Individual Relationship Route: `/src/app/api/relationships/[id]/route.ts`

```typescript
import {NextResponse} from 'next/server';
import {createClient} from '@/utils/supabase/server';
import supabaseAdmin from '@/utils/supabase/admin';

// PATCH /api/relationships/[id] - Update relationship
export async function PATCH(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const body = await request.json();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.relationshipType !== undefined) updateData.relationship_type = body.relationshipType;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.validFrom !== undefined) updateData.valid_from = body.validFrom;
    if (body.validTo !== undefined) updateData.valid_to = body.validTo;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const {data, error} = await supabaseAdmin
      .from('member_club_relationships')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating relationship:', error);
      return NextResponse.json(
        {error: `Chyba při aktualizaci vztahu: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({data, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

// DELETE /api/relationships/[id] - Delete relationship
export async function DELETE(
  request: Request,
  {params}: {params: {id: string}}
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {data: {user}} = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    const {error} = await supabaseAdmin
      .from('member_club_relationships')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting relationship:', error);
      return NextResponse.json(
        {error: `Chyba při mazání vztahu: ${error.message}`},
        {status: 500}
      );
    }

    return NextResponse.json({success: true, error: null});
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}
```

---

### Step 2: Update API Routes Helper (Auto-generated)

The API routes are **auto-generated** by running:

```bash
npm run generate:api-routes
```

This automatically scans `/src/app/api/` and generates `/src/lib/api-routes.ts` with type-safe constants.

After creating the API routes from Step 1, the generated constants will be:

```typescript
// Generated in src/lib/api-routes.ts
export const API_ROUTES = {
  members: {
    root: '/api/members',                                          // POST to create member
    byId: (id: string | number) => `/api/members/${id}`,         // GET/PATCH/DELETE member
    relationships: (id: string | number) => `/api/members/${id}/relationships`, // GET/POST relationships
    // ... other member routes
  },
  relationships: {
    byId: (id: string | number) => `/api/relationships/${id}`,   // PATCH/DELETE relationship
  }
}
```

**Usage in code:**

```typescript
import { API_ROUTES } from '@/lib/api-routes';

// Create member
fetch(API_ROUTES.members.root, { method: 'POST', body: ... });

// Get/Update/Delete member
fetch(API_ROUTES.members.byId('123'), { method: 'GET' });
fetch(API_ROUTES.members.byId('123'), { method: 'PATCH', body: ... });
fetch(API_ROUTES.members.byId('123'), { method: 'DELETE' });

// Member relationships
fetch(API_ROUTES.members.relationships('123'), { method: 'GET' });
fetch(API_ROUTES.members.relationships('123'), { method: 'POST', body: ... });

// Update/Delete relationship
fetch(API_ROUTES.relationships.byId('456'), { method: 'PATCH', body: ... });
fetch(API_ROUTES.relationships.byId('456'), { method: 'DELETE' });
```

**Note:** The routes are auto-generated on every commit that modifies `/src/app/api/` files via a pre-commit hook.

---

### Step 3: Refactor `useMembers` Hook

Transform the hook to use `fetch()` instead of direct Supabase queries:

```typescript
'use client';
import {useState, useCallback} from 'react';
import {showToast} from '@/components';
import {MemberFormData, Member, UpdateMemberData, convertSchemaToMember} from '@/types';
import {API_ROUTES} from '@/lib/api-routes';

export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Hook for managing members - provides full CRUD operations via API
 * Now follows proper Next.js architecture with API routes
 */
export function useMembers() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Validate member form data
   */
  const validateForm = useCallback((formData: MemberFormData): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Jméno je povinné';
    }
    if (!formData.surname.trim()) {
      newErrors.surname = 'Příjmení je povinné';
    }
    if (!formData.registration_number.trim()) {
      newErrors.registration_number = 'Registrační číslo je povinné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  /**
   * Create a new member via API
   */
  const createMember = useCallback(
    async (
      formData: MemberFormData,
      categoryId?: string | null,
      clubId?: string | null
    ): Promise<Member> => {
      if (!validateForm(formData)) {
        throw new Error('Formulář obsahuje chyby');
      }

      setIsLoading(true);
      setErrors({});

      try {
        // Step 1: Create member
        const response = await fetch(API_ROUTES.members.root, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name: formData.name.trim(),
            surname: formData.surname.trim(),
            registration_number: formData.registration_number.trim(),
            date_of_birth: formData.date_of_birth ?? null,
            sex: formData.sex,
            functions: formData.functions,
            category_id: categoryId ?? null,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při vytváření člena');
        }

        // Step 2: Create member-club relationship if clubId is provided
        if (clubId && result.data) {
          const relationshipResponse = await fetch(
            API_ROUTES.members.relationships(result.data.id),
            {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({clubId}),
            }
          );

          if (!relationshipResponse.ok) {
            const relationshipError = await relationshipResponse.json();
            console.error('Error creating relationship:', relationshipError);
            // Don't throw here - member was created successfully
            showToast.warning('Člen vytvořen, ale nepodařilo se přiřadit ke klubu');
          }
        }

        const convertedMember = convertSchemaToMember(result.data);
        showToast.success('Člen byl úspěšně vytvořen');

        return convertedMember;
      } catch (error) {
        console.error('Error creating member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba při vytváření člena';
        showToast.danger(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm]
  );

  /**
   * Update an existing member via API
   */
  const updateMember = useCallback(
    async (memberData: UpdateMemberData): Promise<Member> => {
      setIsLoading(true);
      setErrors({});

      try {
        const response = await fetch(API_ROUTES.members.byId(memberData.id), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(memberData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při aktualizaci člena');
        }

        const convertedMember = convertSchemaToMember(result.data);
        showToast.success('Člen byl úspěšně aktualizován');

        return convertedMember;
      } catch (error) {
        console.error('Error updating member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba při aktualizaci člena';
        showToast.danger(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a member via API
   */
  const deleteMember = useCallback(
    async (memberId: string): Promise<void> => {
      setIsLoading(true);
      setErrors({});

      try {
        const response = await fetch(API_ROUTES.members.byId(memberId), {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při mazání člena');
        }

        showToast.success('Člen byl úspěšně smazán');
      } catch (error) {
        console.error('Error deleting member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Chyba při mazání člena';
        showToast.danger(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Clear validation errors for a specific field
   */
  const clearFieldError = useCallback(
    (field: string) => {
      if (errors[field]) {
        setErrors((prev) => ({...prev, [field]: ''}));
      }
    },
    [errors]
  );

  /**
   * Clear all validation errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setErrors({});
    setIsLoading(false);
  }, []);

  return {
    // State
    isLoading,
    errors,

    // CRUD Operations
    createMember,
    updateMember,
    deleteMember,

    // Validation
    clearFieldError,
    clearAllErrors,
    reset,
  };
}
```

---

### Step 4: Refactor `useMemberClubRelationships` Hook

Similarly, refactor to use API calls:

```typescript
'use client';
import {useState, useCallback} from 'react';
import {showToast} from '@/components';
import {RelationshipType, RelationshipStatus} from '@/enums';
import {API_ROUTES} from '@/lib/api-routes';

export interface CreateMemberClubRelationshipData {
  memberId: string;
  clubId: string;
  relationshipType?: RelationshipType;
  status?: RelationshipStatus;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}

export interface UpdateMemberClubRelationshipData {
  relationshipId: string;
  relationshipType?: RelationshipType;
  status?: RelationshipStatus;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}

/**
 * Hook for managing member-club relationships via API
 */
export function useMemberClubRelationships() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a member-club relationship via API
   */
  const createRelationship = useCallback(
    async (data: CreateMemberClubRelationshipData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.members.relationships(data.memberId), {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            clubId: data.clubId,
            relationshipType: data.relationshipType,
            status: data.status,
            validFrom: data.validFrom,
            validTo: data.validTo,
            notes: data.notes,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při vytváření vztahu člen-klub');
        }

        showToast.success('Vztah člen-klub byl úspěšně vytvořen');
      } catch (error) {
        console.error('Error creating member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při vytváření vztahu člen-klub';
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Update a member-club relationship via API
   */
  const updateRelationship = useCallback(
    async (data: UpdateMemberClubRelationshipData): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.relationships.byId(data.relationshipId), {
          method: 'PATCH',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při aktualizaci vztahu člen-klub');
        }

        showToast.success('Vztah člen-klub byl úspěšně aktualizován');
      } catch (error) {
        console.error('Error updating member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při aktualizaci vztahu člen-klub';
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Delete a member-club relationship via API
   */
  const deleteRelationship = useCallback(
    async (relationshipId: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.relationships.byId(relationshipId), {
          method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při mazání vztahu člen-klub');
        }

        showToast.success('Vztah člen-klub byl úspěšně smazán');
      } catch (error) {
        console.error('Error deleting member-club relationship:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při mazání vztahu člen-klub';
        showToast.danger(errorMessage);
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get member-club relationships for a specific member via API
   */
  const getMemberRelationships = useCallback(
    async (memberId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.members.relationships(memberId));
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při načítání vztahů člena');
        }

        return result.data || [];
      } catch (error) {
        console.error('Error fetching member relationships:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při načítání vztahů člena';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get member-club relationships for a specific club via API
   * Note: You'll need to create /api/clubs/[id]/relationships route for this
   */
  const getClubRelationships = useCallback(
    async (clubId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/clubs/${clubId}/relationships`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Chyba při načítání vztahů klubu');
        }

        return result.data || [];
      } catch (error) {
        console.error('Error fetching club relationships:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Chyba při načítání vztahů klubu';
        setError(errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    createRelationship,
    updateRelationship,
    deleteRelationship,
    getMemberRelationships,
    getClubRelationships,
  };
}
```

---

## Migration Checklist

- [ ] **Step 1**: Create `/src/app/api/members/route.ts` with POST handler
- [ ] **Step 2**: Create `/src/app/api/members/[id]/route.ts` with PATCH and DELETE handlers
- [ ] **Step 3**: Create `/src/app/api/members/[id]/relationships/route.ts` with POST and GET handlers
- [ ] **Step 4**: Create `/src/app/api/relationships/[id]/route.ts` with PATCH and DELETE handlers
- [ ] **Step 5**: Update `/src/lib/api-routes.ts` with new route helpers
- [ ] **Step 6**: Refactor `useMembers` hook to use fetch() instead of Supabase client
- [ ] **Step 7**: Refactor `useMemberClubRelationships` hook to use fetch()
- [ ] **Step 8**: Test all CRUD operations:
  - [ ] Create member
  - [ ] Update member
  - [ ] Delete member
  - [ ] Create member with club relationship
  - [ ] Update relationship
  - [ ] Delete relationship
- [ ] **Step 9**: Remove old `createClient()` imports from hooks
- [ ] **Step 10**: Verify no direct Supabase calls remain in client-side hooks

---

## Key Differences

| Aspect | Before (Wrong) | After (Correct) |
|--------|----------------|-----------------|
| **Location** | Hook (client-side) | API Route (server-side) |
| **DB Access** | `createClient()` | `createClient()` or `supabaseAdmin` |
| **Validation** | Client-only | Server-side (secure) |
| **Authorization** | Bypassed | Enforced via `getUser()` |
| **Error Handling** | Client toasts only | Server logs + client toasts |
| **Security** | DB structure exposed | Protected by API layer |

---

## Benefits of This Refactor

1. **Security**: All database operations go through authenticated API routes
2. **Validation**: Server-side validation prevents malicious data
3. **Consistency**: Matches your existing API architecture pattern
4. **Maintainability**: Business logic centralized in API routes
5. **Scalability**: Easier to add middleware, rate limiting, caching, etc.
6. **Testing**: API routes can be tested independently
7. **Type Safety**: Clear API contracts between client and server

---

## Notes

- Use `supabaseAdmin` for write operations in API routes (bypasses RLS)
- Use `createClient()` for read operations that respect RLS
- Always check authentication in API routes via `getUser()`
- Return consistent error format: `{error: string, data?: any}`
- Use proper HTTP status codes (200, 201, 400, 401, 500)
- Consider adding Zod validation schemas for request bodies
- Consider adding rate limiting middleware for production

---

## Pattern to Follow (from your codebase)

Your `/api/members/functions/route.ts` already follows the correct pattern:
- ✅ Uses `supabaseAdmin` for write operations
- ✅ Has proper error handling with try-catch
- ✅ Returns consistent JSON responses
- ✅ Has validation for required fields
- ✅ Uses proper HTTP methods (GET, POST, PUT, DELETE)

Use this as your reference implementation!