# Coach Card Implementation Plan

## Overview and Goals

### Feature Description
Implement a "Coach Card" feature that allows coaches to create and manage their personal contact cards, which can be optionally displayed on public category pages.

### Key Feature: Per-Category Visibility Control
Instead of a simple publish/unpublish toggle, coaches have **granular control** over which categories their card is visible on:

- **`published_categories: UUID[]`** - Array of category IDs where the card is published
- Coach can select any subset of their assigned categories
- Empty array = card is completely private
- UI: CheckboxGroup with category chips for easy selection
- Quick actions: "Publish to All" and "Unpublish All" buttons

### Goals
1. **Coach Self-Management**: Coaches can fully manage their own card data through the coach portal
2. **Per-Category Privacy Control**: Coaches can choose which categories to publish their card to (not all-or-nothing)
3. **Public Visibility**: Published coach cards are displayed on relevant category public pages
4. **Multi-Coach Support**: Categories can have multiple coaches, all displayed if they've published their cards

### User Stories
- As a coach, I want to create my personal card with my contact information
- As a coach, I want to upload my photo to personalize my card
- As a coach, I want to select which categories my card is visible on (from my assigned categories)
- As a visitor, I want to see coach contact information on category pages

---

## Architecture Overview

Following the established project patterns:

### Layer Separation
```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Server Components (Public Pages)                            │
│  └── CategoryPage (fetches data server-side)                │
│  └── CoachContactsSection (receives data as props)          │
│                                                             │
│  Client Components (Coach Portal)                           │
│  └── CoachCardEditor (uses hooks for mutations)             │
├─────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Factory Hooks (createDataFetchHook, createCRUDHook)        │
│  └── useFetchCoachCard                                      │
│  └── useCoachCard (CRUD operations)                         │
├─────────────────────────────────────────────────────────────┤
│                      QUERY LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  src/queries/coachCards/                                    │
│  └── constants.ts (DB_TABLE, ENTITY)                        │
│  └── queries.ts (getAllCoachCards, getCoachCardByUserId)    │
│  └── mutations.ts (create, update, delete)                  │
├─────────────────────────────────────────────────────────────┤
│                      API LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  /api/entities/coach_cards (via ENTITY_CONFIGS)             │
│  /api/coach-cards/public (custom route for public cards)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Design

### New Table: `coach_cards`

```sql
CREATE TABLE coach_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Personal Information
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    note TEXT,  -- Public description/bio

    -- Photo (Supabase Storage)
    photo_url TEXT,
    photo_path TEXT,  -- Storage path for deletion

    -- Per-Category Privacy Control
    -- Array of category UUIDs where this card is published
    -- Empty array = card is not published anywhere (private)
    published_categories UUID[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id)  -- One card per user
);

-- Indexes
CREATE INDEX idx_coach_cards_user_id ON coach_cards(user_id);
-- GIN index for efficient array containment queries
CREATE INDEX idx_coach_cards_published_categories ON coach_cards USING GIN(published_categories);

-- RLS Policies
ALTER TABLE coach_cards ENABLE ROW LEVEL SECURITY;

-- Users can read their own card
CREATE POLICY "Users can view own coach card"
ON coach_cards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own card
CREATE POLICY "Users can create own coach card"
ON coach_cards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own card
CREATE POLICY "Users can update own coach card"
ON coach_cards FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own card
CREATE POLICY "Users can delete own coach card"
ON coach_cards FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Anyone can read cards that are published to at least one category
-- The specific category filtering is done at the query level
CREATE POLICY "Anyone can view published coach cards"
ON coach_cards FOR SELECT
TO anon, authenticated
USING (cardinality(published_categories) > 0);
```

### View: `coach_cards_with_categories`

This view joins coach cards with user profiles to provide assigned categories context.
The `published_categories` field on the coach card controls which categories the card is visible on.
The `assigned_categories` from user_profiles indicates which categories the coach CAN publish to.

```sql
CREATE OR REPLACE VIEW coach_cards_with_categories AS
SELECT
    cc.*,
    up.assigned_categories,
    up.role
FROM coach_cards cc
JOIN user_profiles up ON cc.user_id = up.user_id
WHERE up.role IN ('coach', 'head_coach', 'admin');
```

**Key distinction:**
- `published_categories` (on coach_card) = categories where the card IS visible (coach's choice)
- `assigned_categories` (from user_profile) = categories the coach CAN publish to (admin's assignment)

### Supabase Storage Bucket

```sql
-- Create bucket for coach photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('coach-photos', 'coach-photos', true);

-- Storage policies
CREATE POLICY "Users can upload own coach photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'coach-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own coach photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'coach-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own coach photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'coach-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view coach photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'coach-photos');
```

---

## Type Definitions

### File: `src/types/entities/coach-card/data/coachCard.ts`

```typescript
/**
 * Core coach card data as stored in database
 */
export interface CoachCard {
  id: string;
  user_id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  photo_url: string | null;
  photo_path: string | null;
  /**
   * Array of category UUIDs where this card is published.
   * Empty array = card is not published anywhere (private).
   * Coach can only add categories they are assigned to (from user_profiles.assigned_categories).
   */
  published_categories: string[];
  created_at: string;
  updated_at: string;
}

/**
 * Coach card with additional user profile data
 * Used in coach portal to show available categories for publishing
 */
export interface CoachCardWithCategories extends CoachCard {
  /**
   * Categories the coach is assigned to (from user_profiles).
   * These are the categories the coach CAN publish to.
   */
  assigned_categories: string[];
  role: 'coach' | 'head_coach' | 'admin';
}

/**
 * Coach card for public display (filtered fields)
 */
export interface PublicCoachCard {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  photo_url: string | null;
}
```

### File: `src/types/entities/coach-card/data/coachCardForms.ts`

```typescript
/**
 * Form data for creating/editing coach card
 */
export interface CoachCardFormData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  note: string;
  /**
   * Array of category UUIDs to publish the card to.
   * Empty array = card is not published anywhere (private).
   */
  published_categories: string[];
}

/**
 * Data for inserting a new coach card
 */
export interface CoachCardInsert {
  user_id: string;
  name: string;
  surname: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
  /**
   * Array of category UUIDs to publish the card to.
   * Default is empty array (not published anywhere).
   */
  published_categories?: string[];
}

/**
 * Data for updating an existing coach card
 */
export interface CoachCardUpdate {
  name?: string;
  surname?: string;
  email?: string | null;
  phone?: string | null;
  note?: string | null;
  photo_url?: string | null;
  photo_path?: string | null;
  /**
   * Array of category UUIDs to publish the card to.
   * Pass empty array to unpublish from all categories.
   */
  published_categories?: string[];
  updated_at?: string;
}
```

### File: `src/types/entities/coach-card/index.ts`

```typescript
export * from './data/coachCard';
export * from './data/coachCardForms';
```

### Update: `src/types/index.ts`

```typescript
// Add to existing exports
export * from './entities/coach-card';
```

---

## Query Layer

Following the established pattern in `src/queries/`, create a dedicated query module.

### File: `src/queries/coachCards/constants.ts`

```typescript
export const DB_TABLE = 'coach_cards';

export const ENTITY = {
  plural: 'CoachCards',
  singular: 'CoachCard',
};
```

### File: `src/queries/coachCards/queries.ts`

```typescript
import { buildSelectQuery, buildSelectOneQuery, handleSupabasePaginationBug } from '@/queries';
import { GetEntitiesOptions, QueryContext, QueryResult } from '@/queries/shared/types';
import { CoachCard, CoachCardWithCategories } from '@/types';
import { DB_TABLE, ENTITY } from './constants';

interface GetCoachCardsOptions extends GetEntitiesOptions {
  filters?: {
    user_id?: string;
    /**
     * Filter by cards published to a specific category
     */
    published_to_category?: string;
  };
}

/**
 * Get all coach cards with optional filtering
 */
export async function getAllCoachCards(
  ctx: QueryContext,
  options?: GetCoachCardsOptions
): Promise<QueryResult<CoachCard[]>> {
  try {
    const query = buildSelectQuery(ctx.supabase, DB_TABLE, {
      filters: options?.filters,
      sorting: options?.sorting,
      pagination: options?.pagination,
    });

    const { data, error, count } = await query;

    const paginationBugResult = handleSupabasePaginationBug<CoachCard>(error, count);
    if (paginationBugResult) return paginationBugResult;

    return {
      data: data as CoachCard[],
      error: null,
      count: count ?? 0,
    };
  } catch (err: any) {
    console.error(`Exception in getAll${ENTITY.plural}:`, err);
    return { data: null, error: err.message || 'Unknown error', count: 0 };
  }
}

/**
 * Get coach card by ID
 */
export async function getCoachCardById(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<CoachCard>> {
  try {
    const query = buildSelectOneQuery(ctx.supabase, DB_TABLE, id);
    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CoachCard, error: null };
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ById:`, err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

/**
 * Get coach card by user ID
 */
export async function getCoachCardByUserId(
  ctx: QueryContext,
  userId: string
): Promise<QueryResult<CoachCard>> {
  try {
    const { data, error } = await ctx.supabase
      .from(DB_TABLE)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CoachCard | null, error: null };
  } catch (err: any) {
    console.error(`Exception in get${ENTITY.singular}ByUserId:`, err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

/**
 * Get coach cards published to a specific category (server-side)
 * Uses the view that joins with user_profiles
 *
 * Filters by:
 * - published_categories contains the given categoryId (card is published to this category)
 */
export async function getPublishedCoachCardsByCategory(
  ctx: QueryContext,
  categoryId: string
): Promise<QueryResult<CoachCardWithCategories[]>> {
  try {
    const { data, error } = await ctx.supabase
      .from('coach_cards_with_categories')
      .select('*')
      // Check if the card's published_categories array contains this categoryId
      .contains('published_categories', [categoryId]);

    if (error) {
      return { data: null, error: error.message, count: 0 };
    }

    return { data: data as CoachCardWithCategories[], error: null, count: data?.length ?? 0 };
  } catch (err: any) {
    console.error('Exception in getPublishedCoachCardsByCategory:', err);
    return { data: null, error: err.message || 'Unknown error', count: 0 };
  }
}
```

### File: `src/queries/coachCards/mutations.ts`

```typescript
import { QueryContext, QueryResult } from '@/queries/shared/types';
import { CoachCard, CoachCardInsert, CoachCardUpdate } from '@/types';
import { DB_TABLE, ENTITY } from './constants';

/**
 * Create a new coach card
 */
export async function createCoachCard(
  ctx: QueryContext,
  data: CoachCardInsert
): Promise<QueryResult<CoachCard>> {
  try {
    const { data: card, error } = await ctx.supabase
      .from(DB_TABLE)
      .insert(data)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: card as CoachCard, error: null };
  } catch (err: any) {
    console.error(`Exception in create${ENTITY.singular}:`, err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

/**
 * Update an existing coach card
 */
export async function updateCoachCard(
  ctx: QueryContext,
  id: string,
  data: CoachCardUpdate
): Promise<QueryResult<CoachCard>> {
  try {
    const { data: card, error } = await ctx.supabase
      .from(DB_TABLE)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: card as CoachCard, error: null };
  } catch (err: any) {
    console.error(`Exception in update${ENTITY.singular}:`, err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}

/**
 * Delete a coach card
 */
export async function deleteCoachCard(
  ctx: QueryContext,
  id: string
): Promise<QueryResult<{ success: boolean }>> {
  try {
    const { error } = await ctx.supabase
      .from(DB_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { success: true }, error: null };
  } catch (err: any) {
    console.error(`Exception in delete${ENTITY.singular}:`, err);
    return { data: null, error: err.message || 'Unknown error' };
  }
}
```

### File: `src/queries/coachCards/index.ts`

```typescript
export { DB_TABLE, ENTITY } from './constants';
export { getAllCoachCards, getCoachCardById, getCoachCardByUserId, getPublishedCoachCardsByCategory } from './queries';
export { createCoachCard, updateCoachCard, deleteCoachCard } from './mutations';
```

---

## API Configuration

### Update: `src/app/api/entities/config.ts`

```typescript
import * as coachCardsQueries from '@/queries/coachCards';

// Add to ENTITY_CONFIGS:
coach_cards: {
  tableName: coachCardsQueries.DB_TABLE,
  sortBy: [{ column: 'surname', ascending: true }],
  requiresAdmin: false,
  filters: [
    { paramName: 'userId', dbColumn: 'user_id' },
    // Note: filtering by published_categories is handled by the custom public endpoint
    // using array containment query, not the generic entities API
  ],
  queryLayer: {
    getAll: coachCardsQueries.getAllCoachCards,
    getById: coachCardsQueries.getCoachCardById,
    create: coachCardsQueries.createCoachCard,
    update: coachCardsQueries.updateCoachCard,
    delete: coachCardsQueries.deleteCoachCard,
  },
},
```

---

## Hook Specifications

Using factory patterns from `src/hooks/factories/`.

### File: `src/hooks/entities/coach-card/data/useFetchCoachCard.ts`

```typescript
'use client';

import { createDataFetchHook } from '@/hooks/factories';
import { API_ROUTES, translations } from '@/lib';
import { DB_TABLE, ENTITY } from '@/queries/coachCards';
import { CoachCard } from '@/types';

const t = translations.coachCard.toasts;

/**
 * Hook to fetch coach card for a specific user
 * Uses the factory pattern for consistent data fetching
 */
export function useFetchCoachCard(params: { userId: string }) {
  return createDataFetchHook<CoachCard, { userId: string }>({
    endpoint: (params) => {
      const searchParams = new URLSearchParams();
      searchParams.set('userId', params.userId);
      return `${API_ROUTES.entities.root(DB_TABLE)}?${searchParams.toString()}`;
    },
    entityName: ENTITY.singular,
    errorMessage: t.fetchError,
    fetchOnMount: !!params.userId,
    extractSingle: true, // Extract single item from array
  })(params);
}
```

### File: `src/hooks/entities/coach-card/data/useFetchPublicCoachCards.ts`

```typescript
'use client';

import { createDataFetchHook } from '@/hooks/factories';
import { translations } from '@/lib';
import { CoachCardWithCategories } from '@/types';

const t = translations.coachCard.toasts;

/**
 * Hook to fetch published coach cards for a specific category
 * Uses a custom API endpoint that returns only published cards
 */
export function useFetchPublicCoachCards(params: { categoryId: string }) {
  return createDataFetchHook<CoachCardWithCategories, { categoryId: string }>({
    endpoint: (params) => `/api/coach-cards/public?categoryId=${params.categoryId}`,
    entityName: 'PublicCoachCards',
    errorMessage: t.fetchError,
    fetchOnMount: !!params.categoryId,
  })(params);
}
```

### File: `src/hooks/entities/coach-card/state/useCoachCard.ts`

```typescript
'use client';

import { createCRUDHook } from '@/hooks/factories';
import { API_ROUTES, translations } from '@/lib';
import { DB_TABLE, ENTITY } from '@/queries/coachCards';
import { CoachCard, CoachCardInsert } from '@/types';

const t = translations.coachCard.responseMessages;

/**
 * Hook for coach card CRUD operations
 * Uses the factory pattern for consistent mutations
 */
export function useCoachCard() {
  const { loading, error, create, update, deleteItem, setLoading } = createCRUDHook<
    CoachCard,
    CoachCardInsert
  >({
    baseEndpoint: API_ROUTES.entities.root(DB_TABLE),
    byIdEndpoint: (id) => API_ROUTES.entities.byId(DB_TABLE, id),
    entityName: ENTITY.singular,
    messages: {
      createSuccess: t.createSuccess,
      updateSuccess: t.updateSuccess,
      deleteSuccess: t.deleteSuccess,
      createError: t.createError,
      updateError: t.updateError,
      deleteError: t.deleteError,
    },
  })();

  return {
    loading,
    error,
    setLoading,
    createCoachCard: create,
    updateCoachCard: update,
    deleteCoachCard: deleteItem,
  };
}
```

### File: `src/hooks/entities/coach-card/state/useCoachCardPhoto.ts`

```typescript
'use client';

import { useCallback, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { showToast } from '@/components';
import { translations } from '@/lib/translations';

const STORAGE_BUCKET = 'coach-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Hook for coach card photo operations (upload/delete)
 * Photo operations use Supabase Storage directly, not the entities API
 */
export function useCoachCardPhoto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = useCallback(async (
    file: File,
    userId: string
  ): Promise<{ url: string; path: string } | null> => {
    // Validation
    if (!file.type.startsWith('image/')) {
      showToast.warning(translations.coachCard.validation.invalidImageType);
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast.warning(translations.coachCard.validation.imageTooLarge);
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path);

      return { url: urlData.publicUrl, path };
    } catch (err) {
      console.error('Error uploading photo:', err);
      const errorMsg = err instanceof Error ? err.message : translations.coachCard.toasts.photoUploadError;
      setError(errorMsg);
      showToast.danger(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePhoto = useCallback(async (path: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

      if (deleteError) throw deleteError;

      return true;
    } catch (err) {
      console.error('Error deleting photo:', err);
      const errorMsg = err instanceof Error ? err.message : translations.coachCard.toasts.photoDeleteError;
      setError(errorMsg);
      showToast.danger(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    uploadPhoto,
    deletePhoto,
    clearError,
  };
}
```

### File: `src/hooks/entities/coach-card/index.ts`

```typescript
export { useFetchCoachCard } from './data/useFetchCoachCard';
export { useFetchPublicCoachCards } from './data/useFetchPublicCoachCards';
export { useCoachCard } from './state/useCoachCard';
export { useCoachCardPhoto } from './state/useCoachCardPhoto';
```

### Update: `src/hooks/index.ts`

```typescript
// Add to existing exports
export * from './entities/coach-card';
```

---

## Public API Endpoint

For fetching published coach cards by category, create a dedicated public endpoint.

### File: `src/app/api/coach-cards/public/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPublishedCoachCardsByCategory } from '@/queries/coachCards';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');

  if (!categoryId) {
    return NextResponse.json(
      { error: 'categoryId is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const result = await getPublishedCoachCardsByCategory({ supabase }, categoryId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    console.error('Error fetching public coach cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Server-Side Data Fetching

For public category pages, coach cards should be fetched server-side following the existing pattern.

### Update: `src/utils/categoryPageData.ts`

```typescript
import { getPublishedCoachCardsByCategory } from '@/queries/coachCards';

// Add to CategoryPageServerData interface:
coachCards: PublicCoachCard[];

// Add to getCategoryPageData function:
export async function getCategoryPageData(categorySlug: string, options = {}) {
  // ... existing code ...

  // Add to Batch 2 (parallel fetch with matches, posts, standings):
  const coachCardsResult = await getPublishedCoachCardsByCategory(
    { supabase },
    category.id
  );

  return {
    // ... existing fields ...
    coachCards: coachCardsResult.data || [],
  };
}
```

### Update: `src/app/(main)/categories/[slug]/page.tsx`

```typescript
// This is a SERVER COMPONENT (no 'use client' directive)
import { CoachContactsSection } from '@/app/(main)/categories/components';

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category, matches, posts, standings, coachCards } = await getCategoryPageData(categorySlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* ... existing content ... */}

      {/* Coach Contacts - only render if there are published cards */}
      {coachCards.length > 0 && (
        <div className="order-4">
          <CoachContactsSection coaches={coachCards} />
        </div>
      )}
    </div>
  );
}
```

---

## Component Specifications

### Server vs Client Components Strategy

This feature uses **both server and client components** following Next.js App Router best practices:

| Component Location | Type | Purpose |
|-------------------|------|---------|
| `src/app/(main)/categories/components/` | Server | Public category pages - data passed as props from parent |
| `src/components/features/coaches/` | Client | Reusable client-side components with their own hooks |
| `src/app/coaches/profile/components/` | Client | Coach portal with form state and mutations |

**Why Server Components for Public Pages?**
- Faster initial page load (no client-side JS for display)
- Better SEO (content rendered on server)
- Data fetched once on server, passed to components

**Why Client Components for Coach Portal?**
- Needs form state management
- Requires user interactions (uploads, edits, toggles)
- Uses hooks for mutations and optimistic updates

---

### Server Component: `src/app/(main)/categories/components/CoachContactsSection.tsx`

This is a **server component** that receives data as props (no hooks, no 'use client').

```typescript
// NO 'use client' - this is a server component
import { Card, CardBody, CardHeader } from '@heroui/react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

import { translations } from '@/lib/translations';
import { PublicCoachCard } from '@/types';

import CoachCardDisplay from './CoachCardDisplay';

interface CoachContactsSectionProps {
  coaches: PublicCoachCard[];
  title?: string;
}

/**
 * Server component that displays coach cards for a category
 * Receives data as props from the parent server component (CategoryPage)
 */
export default function CoachContactsSection({
  coaches,
  title = translations.coachCard.section.title
}: CoachContactsSectionProps) {
  if (coaches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </CardHeader>
      <CardBody>
        <div className={`grid gap-4 ${
          coaches.length === 1
            ? 'grid-cols-1 max-w-sm mx-auto'
            : coaches.length === 2
              ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {coaches.map((coach) => (
            <CoachCardDisplay key={coach.id} coach={coach} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
```

### Server Component: `src/app/(main)/categories/components/CoachCardDisplay.tsx`

```typescript
// NO 'use client' - this is a server component
import { Avatar, Card, CardBody, Link } from '@heroui/react';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

import { PublicCoachCard } from '@/types';

interface CoachCardDisplayProps {
  coach: PublicCoachCard;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Server component that displays a single coach card
 */
export default function CoachCardDisplay({ coach, size = 'md' }: CoachCardDisplayProps) {
  const avatarSize = size === 'sm' ? 'md' : 'lg';
  const textSizeClass = size === 'sm' ? 'text-sm' : 'text-base';
  const fullName = `${coach.name} ${coach.surname}`;

  return (
    <Card className="h-full">
      <CardBody className="flex flex-col items-center text-center p-6">
        <Avatar
          src={coach.photo_url ?? undefined}
          name={fullName}
          size={avatarSize}
          className={size === 'lg' ? 'w-24 h-24' : undefined}
          isBordered
          color="primary"
        />

        <h4 className={`font-semibold mt-4 ${textSizeClass}`}>
          {fullName}
        </h4>

        {coach.note && (
          <p className={`text-gray-600 mt-2 line-clamp-3 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {coach.note}
          </p>
        )}

        <div className="mt-4 space-y-2 w-full">
          {coach.email && (
            <Link
              href={`mailto:${coach.email}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{coach.email}</span>
            </Link>
          )}
          {coach.phone && (
            <Link
              href={`tel:${coach.phone}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <PhoneIcon className="w-4 h-4 flex-shrink-0" />
              <span>{coach.phone}</span>
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
```

---

### Client Component: `src/app/coaches/profile/components/CoachCardEditor.tsx`

This is a **client component** because it needs interactivity (form state, mutations).

**Key changes for per-category visibility:**
- Replace `Switch` for `is_published` with `CheckboxGroup` for selecting categories
- Fetch user's assigned categories to show as options
- Allow coach to select which of their assigned categories to publish to

```typescript
'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  CheckboxGroup,
  Chip,
  Input,
  Textarea,
  Skeleton,
} from '@heroui/react';
import { CameraIcon, TrashIcon, UserCircleIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

import { translations } from '@/lib/translations';
import { useUser } from '@/contexts/UserContext';
import { LoadingSpinner, showToast } from '@/components';
import { useFetchCoachCard, useCoachCard, useCoachCardPhoto, useFetchCategories } from '@/hooks';
import { CoachCard, CoachCardFormData, Category } from '@/types';

interface CoachCardEditorProps {
  onSaveSuccess?: () => void;
}

const INITIAL_FORM_DATA: CoachCardFormData = {
  name: '',
  surname: '',
  email: '',
  phone: '',
  note: '',
  published_categories: [], // Empty array = not published anywhere
};

export default function CoachCardEditor({ onSaveSuccess }: CoachCardEditorProps) {
  const { user, profile } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing card using factory-based hook
  const { data: existingCard, loading: fetchLoading, refetch } = useFetchCoachCard({
    userId: user?.id ?? '',
  });

  // Fetch all categories to display names (user's assigned categories come from profile)
  const { data: allCategories, loading: categoriesLoading } = useFetchCategories();

  // CRUD operations using factory-based hook
  const {
    loading: mutationLoading,
    createCoachCard,
    updateCoachCard,
  } = useCoachCard();

  // Photo operations (separate hook for storage)
  const {
    loading: photoLoading,
    uploadPhoto,
    deletePhoto,
  } = useCoachCardPhoto();

  const [formData, setFormData] = useState<CoachCardFormData>(INITIAL_FORM_DATA);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get the categories the coach is assigned to (can publish to these)
  const assignedCategoryIds = useMemo(() => {
    return profile?.assigned_categories ?? [];
  }, [profile]);

  // Map assigned category IDs to full category objects for display
  const assignedCategories = useMemo(() => {
    if (!allCategories || assignedCategoryIds.length === 0) return [];
    return allCategories.filter((cat: Category) => assignedCategoryIds.includes(cat.id));
  }, [allCategories, assignedCategoryIds]);

  // Populate form when existing card is loaded
  useEffect(() => {
    if (existingCard) {
      setFormData({
        name: existingCard.name,
        surname: existingCard.surname,
        email: existingCard.email ?? '',
        phone: existingCard.phone ?? '',
        note: existingCard.note ?? '',
        published_categories: existingCard.published_categories ?? [],
      });
      setPhotoUrl(existingCard.photo_url);
      setPhotoPath(existingCard.photo_path);
    }
  }, [existingCard]);

  const handleInputChange = (field: keyof CoachCardFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showToast.warning(translations.coachCard.validation.invalidImageType);
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast.warning(translations.coachCard.validation.imageTooLarge);
      return;
    }

    setIsUploading(true);

    // Delete old photo if exists
    if (photoPath) {
      await deletePhoto(photoPath);
    }

    const url = await uploadPhoto(file, user.id);
    if (url) {
      const path = `${user.id}/${url.split('/').pop()}`;
      setPhotoUrl(url);
      setPhotoPath(path);
    }

    setIsUploading(false);
  };

  const handleRemovePhoto = async () => {
    if (!photoPath) return;

    const success = await deletePhoto(photoPath);
    if (success) {
      setPhotoUrl(null);
      setPhotoPath(null);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    // Validation
    if (!formData.name.trim() || !formData.surname.trim()) {
      showToast.warning(translations.coachCard.validation.nameRequired);
      return;
    }

    const cardData = {
      ...formData,
      photo_url: photoUrl,
      photo_path: photoPath,
    };

    let success: boolean;

    if (existingCard) {
      const result = await updateCoachCard(existingCard.id, cardData);
      success = result !== null;
    } else {
      const result = await createCoachCard({
        user_id: user.id,
        ...cardData,
      });
      success = result !== null;
    }

    if (success) {
      await refetch();
      onSaveSuccess?.();
    }
  };

  /**
   * Handle toggling category visibility for the coach card.
   * Updates the published_categories array when checkboxes change.
   */
  const handleCategorySelectionChange = (selectedCategories: string[]) => {
    // Ensure only valid assigned categories are included
    const validCategories = selectedCategories.filter(catId =>
      assignedCategoryIds.includes(catId)
    );
    setFormData((prev) => ({ ...prev, published_categories: validCategories }));
  };

  /**
   * Quick action to publish to all assigned categories
   */
  const handlePublishToAll = () => {
    setFormData((prev) => ({ ...prev, published_categories: [...assignedCategoryIds] }));
  };

  /**
   * Quick action to unpublish from all categories (make private)
   */
  const handleUnpublishAll = () => {
    setFormData((prev) => ({ ...prev, published_categories: [] }));
  };

  // Computed: is the card currently visible anywhere?
  const isPublishedAnywhere = formData.published_categories.length > 0;

  if (fetchLoading) {
    return (
      <Card>
        <CardBody>
          <div className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
            <Skeleton className="h-10 rounded-lg" />
          </div>
        </CardBody>
      </Card>
    );
  }

  const loading = mutationLoading || photoLoading || isUploading;

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-6 h-6" />
          <h3 className="text-xl font-semibold">
            {translations.coachCard.editor.title}
          </h3>
        </div>
        {/* Show publish status indicator */}
        <Chip
          color={isPublishedAnywhere ? 'success' : 'default'}
          variant="flat"
          startContent={<GlobeAltIcon className="w-4 h-4" />}
        >
          {isPublishedAnywhere
            ? translations.coachCard.editor.publishedStatus.replace(
                '{count}',
                String(formData.published_categories.length)
              )
            : translations.coachCard.editor.privateStatus}
        </Chip>
      </CardHeader>
      <CardBody>
        <div className="space-y-6">
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar
                src={photoUrl ?? undefined}
                name={`${formData.name} ${formData.surname}`}
                size="lg"
                className="w-24 h-24"
                isBordered
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="bordered"
                startContent={<CameraIcon className="w-4 h-4" />}
                onPress={() => fileInputRef.current?.click()}
                isDisabled={loading}
              >
                {translations.coachCard.editor.uploadPhoto}
              </Button>
              {photoUrl && (
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  startContent={<TrashIcon className="w-4 h-4" />}
                  onPress={handleRemovePhoto}
                  isDisabled={loading}
                >
                  {translations.coachCard.editor.removePhoto}
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={translations.coachCard.fields.name}
              placeholder={translations.coachCard.placeholders.name}
              value={formData.name}
              onValueChange={(value) => handleInputChange('name', value)}
              isRequired
              isDisabled={loading}
            />
            <Input
              label={translations.coachCard.fields.surname}
              placeholder={translations.coachCard.placeholders.surname}
              value={formData.surname}
              onValueChange={(value) => handleInputChange('surname', value)}
              isRequired
              isDisabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={translations.coachCard.fields.email}
              placeholder={translations.coachCard.placeholders.email}
              type="email"
              value={formData.email}
              onValueChange={(value) => handleInputChange('email', value)}
              isDisabled={loading}
            />
            <Input
              label={translations.coachCard.fields.phone}
              placeholder={translations.coachCard.placeholders.phone}
              type="tel"
              value={formData.phone}
              onValueChange={(value) => handleInputChange('phone', value)}
              isDisabled={loading}
            />
          </div>

          <Textarea
            label={translations.coachCard.fields.note}
            placeholder={translations.coachCard.placeholders.note}
            value={formData.note}
            onValueChange={(value) => handleInputChange('note', value)}
            minRows={3}
            maxRows={6}
            isDisabled={loading}
          />

          {/* Category Visibility Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5" />
                {translations.coachCard.editor.categoryVisibilityTitle}
              </h4>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="success"
                  onPress={handlePublishToAll}
                  isDisabled={loading || assignedCategories.length === 0}
                >
                  {translations.coachCard.editor.publishToAll}
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="default"
                  onPress={handleUnpublishAll}
                  isDisabled={loading || formData.published_categories.length === 0}
                >
                  {translations.coachCard.editor.unpublishAll}
                </Button>
              </div>
            </div>

            {categoriesLoading ? (
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ) : assignedCategories.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  {translations.coachCard.editor.noAssignedCategories}
                </p>
              </div>
            ) : (
              <CheckboxGroup
                label={translations.coachCard.editor.selectCategoriesLabel}
                value={formData.published_categories}
                onValueChange={handleCategorySelectionChange}
                orientation="horizontal"
                isDisabled={loading}
              >
                {assignedCategories.map((category: Category) => (
                  <Checkbox
                    key={category.id}
                    value={category.id}
                    classNames={{
                      base: 'border rounded-lg px-3 py-2 hover:bg-gray-50 data-[selected=true]:bg-success-50 data-[selected=true]:border-success',
                      label: 'text-sm'
                    }}
                  >
                    {category.name}
                  </Checkbox>
                ))}
              </CheckboxGroup>
            )}

            {/* Privacy Notice */}
            <div className={`border rounded-lg p-4 ${
              isPublishedAnywhere
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <p className={`text-sm ${isPublishedAnywhere ? 'text-green-800' : 'text-gray-600'}`}>
                {isPublishedAnywhere
                  ? translations.coachCard.editor.publishedNotice.replace(
                      '{categories}',
                      assignedCategories
                        .filter((cat: Category) => formData.published_categories.includes(cat.id))
                        .map((cat: Category) => cat.name)
                        .join(', ')
                    )
                  : translations.coachCard.editor.unpublishedNotice}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={loading}
            >
              {existingCard
                ? translations.common.actions.save
                : translations.common.actions.create}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
```

### File: `src/components/features/coaches/CoachCardDisplay.tsx`

```typescript
'use client';

import React from 'react';
import { Avatar, Card, CardBody, Link } from '@heroui/react';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

import { PublicCoachCard } from '@/types';

interface CoachCardDisplayProps {
  coach: PublicCoachCard;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display component for a public coach card
 * Used on category public pages
 */
export default function CoachCardDisplay({ coach, size = 'md' }: CoachCardDisplayProps) {
  const avatarSize = size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'lg';
  const textSizeClass = size === 'sm' ? 'text-sm' : 'text-base';

  const fullName = `${coach.name} ${coach.surname}`;

  return (
    <Card className="h-full">
      <CardBody className="flex flex-col items-center text-center p-6">
        {/* Avatar */}
        <Avatar
          src={coach.photo_url ?? undefined}
          name={fullName}
          size={avatarSize}
          className={size === 'lg' ? 'w-24 h-24' : undefined}
          isBordered
          color="primary"
        />

        {/* Name */}
        <h4 className={`font-semibold mt-4 ${textSizeClass}`}>
          {fullName}
        </h4>

        {/* Note/Bio */}
        {coach.note && (
          <p className={`text-gray-600 mt-2 line-clamp-3 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {coach.note}
          </p>
        )}

        {/* Contact Info */}
        <div className="mt-4 space-y-2 w-full">
          {coach.email && (
            <Link
              href={`mailto:${coach.email}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <EnvelopeIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{coach.email}</span>
            </Link>
          )}
          {coach.phone && (
            <Link
              href={`tel:${coach.phone}`}
              className={`flex items-center justify-center gap-2 text-gray-700 hover:text-primary ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            >
              <PhoneIcon className="w-4 h-4 flex-shrink-0" />
              <span>{coach.phone}</span>
            </Link>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
```

### File: `src/components/features/coaches/CoachContactsSection.tsx`

```typescript
'use client';

import React from 'react';
import { Card, CardBody, CardHeader, Skeleton } from '@heroui/react';
import { UserGroupIcon } from '@heroicons/react/24/outline';

import { translations } from '@/lib/translations';
import { useFetchPublicCoachCards } from '@/hooks';

import CoachCardDisplay from './CoachCardDisplay';

interface CoachContactsSectionProps {
  categoryId: string;
  title?: string;
}

/**
 * Section component that displays all published coach cards for a category
 * Used on public category pages
 */
export default function CoachContactsSection({
  categoryId,
  title = translations.coachCard.section.title
}: CoachContactsSectionProps) {
  const { data: coaches, loading, error } = useFetchPublicCoachCards({ categoryId });

  // Don't render if no coaches or error
  if (!loading && (error || coaches.length === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardBody className="flex flex-col items-center p-6">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <Skeleton className="h-5 w-24 mt-4 rounded" />
                  <Skeleton className="h-4 w-full mt-2 rounded" />
                  <Skeleton className="h-4 w-32 mt-4 rounded" />
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className={`grid gap-4 ${
            coaches.length === 1
              ? 'grid-cols-1 max-w-sm mx-auto'
              : coaches.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {coaches.map((coach) => (
              <CoachCardDisplay key={coach.id} coach={coach} />
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
```

### File: `src/components/features/coaches/index.ts`

```typescript
export { default as CoachCardDisplay } from './CoachCardDisplay';
export { default as CoachContactsSection } from './CoachContactsSection';
```

---

## File Structure

```
src/
├── types/
│   └── entities/
│       └── coach-card/
│           ├── data/
│           │   ├── coachCard.ts          # Core types
│           │   └── coachCardForms.ts     # Form/mutation types
│           └── index.ts                   # Barrel export
│
├── queries/
│   └── coachCards/
│       ├── constants.ts                   # DB_TABLE, ENTITY constants
│       ├── queries.ts                     # getAllCoachCards, getCoachCardById, etc.
│       ├── mutations.ts                   # create, update, delete mutations
│       └── index.ts                       # Barrel export
│
├── hooks/
│   └── entities/
│       └── coach-card/
│           ├── data/
│           │   ├── useFetchCoachCard.ts          # Fetch own card (factory hook)
│           │   └── useFetchPublicCoachCards.ts   # Fetch public cards (factory hook)
│           ├── state/
│           │   ├── useCoachCard.ts               # CRUD operations (factory hook)
│           │   └── useCoachCardPhoto.ts          # Photo upload/delete
│           └── index.ts                          # Barrel export
│
├── app/
│   ├── api/
│   │   ├── entities/
│   │   │   └── config.ts                  # Add coach_cards to ENTITY_CONFIGS
│   │   └── coach-cards/
│   │       └── public/
│   │           └── route.ts               # Public API endpoint
│   │
│   ├── (main)/
│   │   └── categories/
│   │       ├── [slug]/
│   │       │   └── page.tsx               # Server component (CategoryPage)
│   │       └── components/
│   │           ├── CoachContactsSection.tsx  # Server component
│   │           └── CoachCardDisplay.tsx      # Server component
│   │
│   └── coaches/
│       └── profile/
│           ├── page.tsx                   # Coach profile page
│           └── components/
│               └── CoachCardEditor.tsx    # Client component - card editor
│
├── components/
│   └── features/
│       └── coaches/
│           ├── CoachCardDisplay.tsx       # Client component - public card display
│           ├── CoachContactsSection.tsx   # Client component - section for category pages
│           └── index.ts                   # Barrel export
│
├── lib/
│   └── translations/
│       └── coachCard.ts                   # Translation strings
│
└── utils/
    ├── categoryPageData.ts                # Add coachCards to server-side fetch
    └── validation/
        └── coachCardValidation.ts         # Validation utilities
```

### Component Usage Decision Tree

```
┌─────────────────────────────────────────────────────────────────────┐
│ Where is the component used?                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─ Public Category Page (server-rendered) ─────────────────────┐  │
│  │                                                               │  │
│  │  Use SERVER COMPONENTS from:                                  │  │
│  │  src/app/(main)/categories/components/                        │  │
│  │  - Data passed as props from parent                          │  │
│  │  - No 'use client' directive                                 │  │
│  │  - No hooks, no state                                        │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Coach Portal (client-side interactivity) ───────────────────┐  │
│  │                                                               │  │
│  │  Use CLIENT COMPONENTS from:                                  │  │
│  │  src/app/coaches/profile/components/                         │  │
│  │  - Has 'use client' directive                                │  │
│  │  - Uses hooks for data fetching and mutations                │  │
│  │  - Manages form state                                        │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─ Reusable Client Display (optional) ─────────────────────────┐  │
│  │                                                               │  │
│  │  Use REUSABLE CLIENT COMPONENTS from:                         │  │
│  │  src/components/features/coaches/                            │  │
│  │  - For cases where client-side fetching is preferred         │  │
│  │  - Has its own hook calls                                    │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Database & Types (Day 1)
1. Create database migration for `coach_cards` table
2. Create view `coach_cards_with_categories`
3. Set up RLS policies
4. Create Supabase storage bucket
5. Define TypeScript types
6. Update type exports

### Phase 2: Hooks (Day 2)
1. Implement `useFetchCoachCard` hook
2. Implement `useFetchPublicCoachCards` hook
3. Implement `useCoachCardMutations` hook
4. Add hook exports to index

### Phase 3: Coach Portal Components (Day 3)
1. Create `CoachCardEditor` component
2. Create coach profile page
3. Add navigation to coach portal
4. Test coach card CRUD operations
5. Test photo upload/delete

### Phase 4: Public Display Components (Day 4)
1. Create `CoachCardDisplay` component
2. Create `CoachContactsSection` component
3. Add component exports

### Phase 5: Integration (Day 5)
1. Integrate `CoachContactsSection` into category public pages
2. Add translations
3. Test end-to-end flow
4. Handle edge cases (no coaches, single coach, etc.)

### Phase 6: Polish & Testing (Day 6)
1. Add loading states and skeletons
2. Add error handling
3. Test responsive design
4. Test accessibility
5. Performance optimization (lazy loading)

---

## Translation Keys

### File: `src/lib/translations/coachCard.ts`

```typescript
export const coachCardTranslations = {
  editor: {
    title: 'Vaše vizitka',
    uploadPhoto: 'Nahrát foto',
    removePhoto: 'Odstranit',
    // Per-category visibility
    categoryVisibilityTitle: 'Viditelnost na stránkách kategorií',
    selectCategoriesLabel: 'Vyberte kategorie, kde se má vizitka zobrazovat',
    publishToAll: 'Publikovat všude',
    unpublishAll: 'Skrýt všude',
    publishedStatus: 'Veřejná ({count})',  // {count} = number of selected categories
    privateStatus: 'Soukromá',
    noAssignedCategories: 'Nemáte přiřazené žádné kategorie. Kontaktujte administrátora pro přiřazení kategorií.',
    publishedNotice: 'Vaše vizitka je viditelná na stránkách: {categories}',  // {categories} = comma-separated list
    unpublishedNotice: 'Vaše vizitka není veřejná. Vyberte kategorie, kde se má zobrazovat.',
  },
  fields: {
    name: 'Jméno',
    surname: 'Příjmení',
    email: 'E-mail',
    phone: 'Telefon',
    note: 'Poznámka / Bio',
  },
  placeholders: {
    name: 'Zadejte jméno',
    surname: 'Zadejte příjmení',
    email: 'vas@email.cz',
    phone: '+420 123 456 789',
    note: 'Krátký popis o vás...',
  },
  validation: {
    nameRequired: 'Jméno a příjmení jsou povinné',
    invalidImageType: 'Pouze obrázky jsou povoleny',
    imageTooLarge: 'Obrázek je příliš velký (max 5MB)',
    invalidCategorySelection: 'Neplatný výběr kategorií',
  },
  toasts: {
    fetchError: 'Nepodařilo se načíst vizitku',
    createSuccess: 'Vizitka byla vytvořena',
    createError: 'Nepodařilo se vytvořit vizitku',
    updateSuccess: 'Vizitka byla aktualizována',
    updateError: 'Nepodařilo se aktualizovat vizitku',
    deleteSuccess: 'Vizitka byla smazána',
    deleteError: 'Nepodařilo se smazat vizitku',
    // Per-category visibility
    visibilityUpdateSuccess: 'Viditelnost vizitky byla aktualizována',
    visibilityUpdateError: 'Nepodařilo se změnit viditelnost',
    publishedToCategories: 'Vizitka je nyní viditelná na vybraných kategoriích',
    unpublishedFromAll: 'Vizitka je nyní skrytá ze všech kategorií',
    photoUploadError: 'Nepodařilo se nahrát foto',
    photoDeleteError: 'Nepodařilo se odstranit foto',
  },
  responseMessages: {
    fetchFailed: 'Nepodařilo se načíst vizitky',
    createSuccess: 'Vizitka byla vytvořena',
    updateSuccess: 'Vizitka byla aktualizována',
    deleteSuccess: 'Vizitka byla smazána',
    createError: 'Nepodařilo se vytvořit vizitku',
    updateError: 'Nepodařilo se aktualizovat vizitku',
    deleteError: 'Nepodařilo se smazat vizitku',
  },
  section: {
    title: 'Kontakty na trenéry',
  },
};
```

---

## Testing Considerations

### Unit Tests
- [ ] Type definitions compile correctly
- [ ] Validation functions work correctly
- [ ] Hook return types are correct

### Integration Tests
- [ ] `useFetchCoachCard` fetches user's own card
- [ ] `useFetchPublicCoachCards` only returns published cards
- [ ] `useCoachCardMutations` creates/updates/deletes correctly
- [ ] Photo upload/delete works with Supabase Storage

### E2E Tests
- [ ] Coach can create a new card
- [ ] Coach can edit existing card
- [ ] Coach can upload/remove photo
- [ ] Coach can publish/unpublish card
- [ ] Public page shows only published cards
- [ ] Public page handles 0, 1, 2, 3+ coaches correctly

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG AA
- [ ] Focus states are visible

---

## Migration & Deployment Notes

### Database Migration Order
1. Create `coach_cards` table with `published_categories UUID[]` field
2. Create view `coach_cards_with_categories`
3. Set up RLS policies with GIN index for array queries
4. Create storage bucket and policies

### Data Migration (if upgrading from is_published boolean)

If migrating from an existing `is_published` boolean field:

```sql
-- Step 1: Add new column
ALTER TABLE coach_cards ADD COLUMN published_categories UUID[] DEFAULT '{}';

-- Step 2: Migrate data - if is_published was true, publish to all assigned categories
UPDATE coach_cards cc
SET published_categories = (
  SELECT COALESCE(up.assigned_categories, '{}')
  FROM user_profiles up
  WHERE up.user_id = cc.user_id
)
WHERE cc.is_published = true;

-- Step 3: Drop old column (after verifying migration)
ALTER TABLE coach_cards DROP COLUMN is_published;

-- Step 4: Create GIN index for efficient array queries
CREATE INDEX idx_coach_cards_published_categories ON coach_cards USING GIN(published_categories);
```

### Environment Variables
No new environment variables required - uses existing Supabase configuration.

### Rollback Plan
1. Drop view `coach_cards_with_categories`
2. Drop table `coach_cards`
3. Delete storage bucket `coach-photos`

### Monitoring
- Monitor Supabase storage usage for photos
- Track coach card creation/publish rates
- Monitor for RLS policy errors

---

## Future Enhancements

1. **Social Links**: Add optional social media links to coach cards
2. **Certifications**: Add coach certifications/qualifications section
3. **Statistics**: Show coaching statistics (matches coached, win rate)
4. **Head Coach Badge**: Visual indicator for head coach role on each category
5. **Calendar Link**: Direct link to coach's training schedule
6. **Bulk Category Management**: Admin interface to manage coach-category assignments
7. **Category-specific Bio**: Allow different bio text for different categories